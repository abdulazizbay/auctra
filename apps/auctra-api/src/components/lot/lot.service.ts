import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Lot, Lots } from '../../libs/dto/lot/lot';
import { LotInput, LotsInquiry, OrdinaryInquiry } from '../../libs/dto/lot/lot.input';
import { LotUpdate } from '../../libs/dto/lot/lot.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { LotStatus, publicLotStatuses } from '../../libs/enums/lot.enum';
import { lookAuthMemberWatched, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { StatisticModifier, T } from '../../libs/types/common';
import { WatchService } from '../watch/watch.service';
import { FollowService } from '../follow/follow.service';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../../socket/socket.gateway';
import { Bid } from '../../libs/dto/bid/bid';
import { NotificationRefType, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class LotService {
	constructor(
		@InjectModel('Lot') private readonly lotModel: Model<Lot>,
		@InjectModel('Bid') private readonly bidModel: Model<Bid>,
		private readonly watchService: WatchService,
		private readonly followService: FollowService,
		private readonly viewService: ViewService,
		private readonly memberService: MemberService,
		private readonly notificationService: NotificationService,
		private readonly socketGateway: SocketGateway,
	) {}

	public async createLot(
		memberId: Types.ObjectId,
		input: LotInput,
	): Promise<Lot> {
		const now = new Date();
		const lotStartsAt = input.lotStartsAt ?? now;
		// clock check, give 1min
		if (
			lotStartsAt.getTime() < now.getTime() - 60_000 ||
			input.lotEndsAt <= lotStartsAt
		)
			throw new BadRequestException(Message.INVALID_LOT_TIME);
		if (
			input.lotCeilingPrice != null &&
			input.lotCeilingPrice <= input.lotStartPrice
		)
			throw new BadRequestException(Message.INVALID_CEILING_PRICE);

		let result: Lot;
		try {
			result = await this.lotModel.create({
				...input,
				memberId,
				lotStartsAt,
				lotCurrentPrice: input.lotStartPrice,
				lotStatus: lotStartsAt > now ? LotStatus.SCHEDULED : LotStatus.OPEN,
			});
		} catch (err) {
			console.log('Error, lot service: ', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		if (result.lotStatus === LotStatus.OPEN) {
			const followerIds = await this.followService.getFollowerIds(memberId);
			await Promise.all(
				followerIds.map((followerId) =>
					this.notificationService.createNotification({
						memberId: followerId,
						notificationType: NotificationType.NEW_LOT_FROM_FOLLOWED,
						notificationRefId: result._id,
						notificationRefType: NotificationRefType.LOT,
						notificationPayload: { lotName: result.lotName },
					}),
				),
			);
		}
		return result;
	}

	public async getLot(
		memberId: Types.ObjectId | null,
		lotId: Types.ObjectId,
	): Promise<Lot> {
		const targetLot = await this.lotModel
			.findOne({ _id: lotId, lotStatus: { $in: publicLotStatuses } })
			.lean()
			.exec();
		if (!targetLot)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (memberId && memberId.toString() !== targetLot.memberId.toString()) {
			const newView = await this.viewService.recordView({
				memberId: memberId,
				viewRefId: lotId,
				viewGroup: ViewGroup.LOT,
			});
			if (newView) {
				await this.lotStatsEditor({ _id: lotId, targetKey: 'lotViews', modifier: 1 });
				targetLot.lotViews++;
			}
		}
		if (memberId) targetLot.meWatched = await this.watchService.checkWatchExistence(memberId, lotId);
		targetLot.memberData = await this.memberService.getMember(null, targetLot.memberId);
		return targetLot;
	}

	public async getLots(
		memberId: Types.ObjectId | null,
		input: LotsInquiry,
	): Promise<Lots> {
		const {
			memberId: sellerId,
			myBids,
			lotStatusList,
			lotCategoryList,
			lotConditionList,
			pricesRange,
			text,
		} = input.search;
		const match: T = {
			lotStatus: lotStatusList?.length ? { $in: lotStatusList } : LotStatus.OPEN,
		};
		if (sellerId) match.memberId = shapeIntoMongoObjectId(sellerId);
		if (myBids)
			match._id = {
				$in: await this.bidModel.distinct('lotId', { memberId: memberId }).exec(),
			};
		if (lotCategoryList?.length) match.lotCategory = { $in: lotCategoryList };
		if (lotConditionList?.length)
			match.lotCondition = { $in: lotConditionList };
		if (pricesRange)
			match.lotCurrentPrice = {
				$gte: pricesRange.start,
				$lte: pricesRange.end,
			};
		if (text) match.lotName = { $regex: new RegExp(text, 'i') };

		const sort = {
			[input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
		};

		const result = await this.lotModel
			.aggregate([
				{ $match: match },
				{ $addFields: { lotPopular: { $add: ['$lotBids', '$lotWatchers'] } } },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookAuthMemberWatched(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async updateLot(
		memberId: Types.ObjectId,
		input: LotUpdate,
	): Promise<Lot> {
		if (input.lotEndsAt && input.lotEndsAt <= new Date())
			throw new BadRequestException(Message.INVALID_LOT_TIME);

		const { _id, ...update } = input as T;
		if (input.lotStartPrice != null)
			update.lotCurrentPrice = input.lotStartPrice;
		if (input.lotStatus === LotStatus.CANCELLED)
			update.lotClosedAt = new Date();

		const result = await this.lotModel
			.findOneAndUpdate(
				{
					_id,
					memberId,
					lotBids: 0,
					lotStatus: { $in: [LotStatus.SCHEDULED, LotStatus.OPEN] },
				},
				update,
				{ new: true, runValidators: true },
			)
			.exec();
		if (!result) throw new BadRequestException(Message.LOT_NOT_EDITABLE);
		return result;
	}

	public async updateLotByAdmin(input: LotUpdate): Promise<Lot> {
		if (input.lotEndsAt && input.lotEndsAt <= new Date())
			throw new BadRequestException(Message.INVALID_LOT_TIME);

		const { _id, ...update } = input as T;
		const filter: T = {
			_id,
			lotStatus: { $in: [LotStatus.SCHEDULED, LotStatus.OPEN] },
		};
		if (input.lotStatus === LotStatus.CANCELLED)
			update.lotClosedAt = new Date();
		else filter.lotBids = 0;
		if (input.lotStartPrice != null)
			update.lotCurrentPrice = input.lotStartPrice;

		const result = await this.lotModel
			.findOneAndUpdate(filter, update, { new: true, runValidators: true })
			.exec();
		if (!result) throw new BadRequestException(Message.LOT_NOT_EDITABLE);

		if (result.lotStatus === LotStatus.CANCELLED) {
			const [bidderIds, watcherIds] = await Promise.all([
				this.bidModel.distinct('memberId', { lotId: result._id }).exec(),
				this.watchService.getWatcherIds(result._id),
			]);
			const memberIds = new Set([result.memberId, ...bidderIds, ...watcherIds].map(String));
			await Promise.all(
				[...memberIds].map((memberId) =>
					this.notificationService.createNotification({
						memberId: shapeIntoMongoObjectId(memberId),
						notificationType: NotificationType.LOT_CANCELLED,
						notificationRefId: result._id,
						notificationRefType: NotificationRefType.LOT,
						notificationPayload: { lotName: result.lotName },
					}),
				),
			);
			this.socketGateway.emitToRoom(`lot:${result._id}`, {
				event: 'lotClosed',
				lotId: result._id,
				lotStatus: result.lotStatus,
				lotCurrentPrice: result.lotCurrentPrice,
				lotHighestBidderId: result.lotHighestBidderId,
				lotClosedAt: result.lotClosedAt,
			});
		}
		return result;
	}

	public async watchTargetLot(memberId: Types.ObjectId, lotId: Types.ObjectId): Promise<Lot> {
		const target = await this.lotModel
			.findOne({ _id: lotId, lotStatus: { $in: publicLotStatuses } })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const modifier = await this.watchService.toggleWatch(memberId, lotId);
		const result = await this.lotStatsEditor({
			_id: lotId,
			targetKey: 'lotWatchers',
			modifier: modifier,
		});
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getWatchedLots(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Lots> {
		return await this.watchService.getWatchedLots(memberId, input);
	}

	public async getVisitedLots(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Lots> {
		return await this.viewService.getVisitedLots(memberId, input);
	}

	public async lotStatsEditor(input: StatisticModifier): Promise<Lot | null> {
		const { _id, targetKey, modifier } = input;
		return await this.lotModel
			.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec();
	}

	public async placeBidOnLot(
		memberId: Types.ObjectId,
		lotId: Types.ObjectId,
		bidPrice: number,
		session?: ClientSession,
	): Promise<Lot | null> {
		const now = new Date();
		const minPrice = {
			$cond: [
				{ $eq: ['$lotBids', 0] },
				'$lotCurrentPrice',
				{ $add: ['$lotCurrentPrice', '$lotMinIncrement'] },
			],
		};

		return await this.lotModel
			.findOneAndUpdate(
				{
					_id: lotId,
					lotStatus: LotStatus.OPEN,
					lotEndsAt: { $gt: now },
					memberId: { $ne: memberId },
					lotHighestBidderId: { $ne: memberId },
					$expr: {
						$gte: [bidPrice, { $min: [minPrice, { $ifNull: ['$lotCeilingPrice', minPrice] }] }],
					},
				},
				[
					{ $set: { lotCurrentPrice: { $min: [bidPrice, { $ifNull: ['$lotCeilingPrice', bidPrice] }] } } },
					{
						$set: {
							lotHighestBidderId: memberId,
							lotBids: { $add: ['$lotBids', 1] },
							lotEndsAt: { $cond: [{ $eq: ['$lotCurrentPrice', '$lotCeilingPrice'] }, now, '$lotEndsAt'] },
						},
					},
				],
				{ new: false, session },
			)
			.exec();
	}
}
