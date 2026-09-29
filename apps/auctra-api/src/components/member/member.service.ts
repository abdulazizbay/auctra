import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { AuthResponse, Member, Members } from '../../libs/dto/member/member';
import {
	LoginInput,
	MemberInput,
	MembersInquiry,
	SellersInquiry,
} from '../../libs/dto/member/member.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationRefType, NotificationType } from '../../libs/enums/notification.enum';
import { MemberSellerStatus, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import {
	MemberUpdate,
	SellerApply,
	SellerStatusUpdate,
} from '../../libs/dto/member/member.update';
import { StatisticModifier, T } from '../../libs/types/common';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private authService: AuthService,
		private readonly notificationService: NotificationService,
	) {}
	public async signup(input: MemberInput): Promise<AuthResponse> {
		input.memberPassword = await this.authService.hashPassword(
			input.memberPassword,
		);
		try {
			const result = await this.memberModel.create(input);
			const accessToken = await this.authService.createToken(result);
			return { member: result, accessToken };
		} catch (err) {
			console.log('Error, member service: ', err);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}
	public async login(input: LoginInput): Promise<AuthResponse> {
		const { memberNick, memberPassword } = input;
		const response = await this.memberModel
			.findOne({ memberNick: memberNick })
			.select('+memberPassword')
			.exec();
		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}
		// compare password
		const isMatch = await this.authService.comparePasswords(
			input.memberPassword,
			response.memberPassword,
		);
		if (!isMatch) {
			throw new InternalServerErrorException(Message.WRONG_PASSWORD);
		}
		const accessToken = await this.authService.createToken(response);
		return { member: response, accessToken };
	}
	public async updateMember(
		memberId: Types.ObjectId,
		input: MemberUpdate,
	): Promise<Member> {
		const result = await this.memberModel
			.findOneAndUpdate(
				{ _id: memberId, memberStatus: MemberStatus.ACTIVE },
				input,
				{
					new: true,
					runValidators: true,
				},
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getMember(
		memberId: Types.ObjectId | null,
		targetId: Types.ObjectId,
	): Promise<Member> {
		const targetMember = await this.memberModel
			.findOne({
				_id: targetId,
				memberStatus: {
					$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
				},
			})
			.lean()
			.exec();
		if (!targetMember)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		// add view
		return targetMember;
	}

	public async getSellers(
		memberId: Types.ObjectId | null,
		input: SellersInquiry,
	): Promise<Members> {
		const { text } = input.search;
		const match: T = {
			memberType: MemberType.SELLER,
			memberStatus: MemberStatus.ACTIVE,
		};
		const sort = {
			[input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
		};
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							//check meLiked
							//check meFollowed
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async applySeller(memberId: Types.ObjectId, input: SellerApply): Promise<Member> {
		const result = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberType: MemberType.USER,
					memberStatus: MemberStatus.ACTIVE,
					memberSellerStatus: { $in: [MemberSellerStatus.NONE, MemberSellerStatus.REJECTED] },
				},
				{
					memberSellerDocUrl: input.memberSellerDocUrl,
					memberSellerStatus: MemberSellerStatus.PENDING,
					memberSellerAppliedAt: new Date(),
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		return result;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { text, memberSellerStatus, memberStatus, memberType } = input.search;
		const match: T = {};
		if (memberSellerStatus) match.memberSellerStatus = memberSellerStatus;
		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		const sort = {
			[input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
		};
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		const { _id, ...update } = input;
		const result = await this.memberModel
			.findOneAndUpdate({ _id }, update, { new: true, runValidators: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async updateSellerStatusByAdmin(input: SellerStatusUpdate): Promise<Member> {
		const { _id, memberSellerStatus } = input;
		const update: T = { memberSellerStatus };
		if (memberSellerStatus === MemberSellerStatus.APPROVED) update.memberType = MemberType.SELLER;

		const result = await this.memberModel
			.findOneAndUpdate({ _id, memberSellerStatus: MemberSellerStatus.PENDING }, update, { new: true })
			.exec();
		if (!result) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		await this.notificationService.createNotification({
			memberId: result._id,
			notificationType:
				memberSellerStatus === MemberSellerStatus.APPROVED
					? NotificationType.SELLER_APPROVED
					: NotificationType.SELLER_REJECTED,
			notificationRefId: result._id,
			notificationRefType: NotificationRefType.MEMBER,
		});
		return result;
	}

	public async memberStatsEditor(
		input: StatisticModifier,
		session?: ClientSession,
	): Promise<Member | null> {
		const { _id, targetKey, modifier } = input;
		return await this.memberModel
			.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true, session })
			.exec();
	}

	public async memberRatingEditor(
		_id: Types.ObjectId,
		rating: number,
		session?: ClientSession,
	): Promise<Member | null> {
		return await this.memberModel
			.findByIdAndUpdate(
				_id,
				[
					{
						$set: {
							memberAvgRating: {
								$divide: [
									{ $add: [{ $multiply: ['$memberAvgRating', '$memberReviewCount'] }, rating] },
									{ $add: ['$memberReviewCount', 1] },
								],
							},
							memberReviewCount: { $add: ['$memberReviewCount', 1] },
						},
					},
				],
				{ new: true, session },
			)
			.exec();
	}
}
