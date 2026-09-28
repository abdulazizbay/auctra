import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lot, Lots } from '../../libs/dto/lot/lot';
import { LotInput, LotsInquiry } from '../../libs/dto/lot/lot.input';
import { LotUpdate } from '../../libs/dto/lot/lot.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { LotStatus, publicLotStatuses } from '../../libs/enums/lot.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class LotService {
	constructor(@InjectModel('Lot') private readonly lotModel: Model<Lot>) {}

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

		try {
			return await this.lotModel.create({
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
		// add view
		return targetLot;
	}

	public async getLots(
		memberId: Types.ObjectId | null,
		input: LotsInquiry,
	): Promise<Lots> {
		const {
			memberId: sellerId,
			lotStatus,
			lotCategoryList,
			lotConditionList,
			pricesRange,
			text,
		} = input.search;
		const match: T = { lotStatus: lotStatus ?? LotStatus.OPEN };
		if (sellerId) match.memberId = shapeIntoMongoObjectId(sellerId);
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
							//check meWatched
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
		return result;
	}

	public async placeBidOnLot(
		memberId: Types.ObjectId,
		lotId: Types.ObjectId,
		bidPrice: number,
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
				{ new: true },
			)
			.exec();
	}
}
