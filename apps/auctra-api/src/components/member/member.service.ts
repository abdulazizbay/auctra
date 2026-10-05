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
	SocialLoginInput,
} from '../../libs/dto/member/member.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notification/notification.service';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeService } from '../like/like.service';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { lookAuthMemberFollowed, lookAuthMemberLiked } from '../../libs/config';
import { Follower } from '../../libs/dto/follow/follow';
import { FollowService } from '../follow/follow.service';
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
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
		private readonly followService: FollowService,
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
		if (!response.memberPassword) {
			throw new InternalServerErrorException(Message.SOCIAL_ACCOUNT);
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
	public async socialLogin(input: SocialLoginInput): Promise<AuthResponse> {
		const { memberAuthType, token } = input;
		const profile = await this.authService.verifySocial(memberAuthType, token);
		let member = await this.memberModel.findOne({ memberAuthType, memberSocialId: profile.socialId }).exec();
		if (!member) {
			const emailUsed = profile.email && (await this.memberModel.exists({ memberEmail: profile.email }));
			member = await this.memberModel.create({
				memberNick: await this.generateNick(profile.name),
				memberAuthType,
				memberSocialId: profile.socialId,
				memberEmail: emailUsed ? undefined : profile.email,
				memberImage: profile.image ?? '',
			});
		} else if (member.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		} else if (member.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}
		const accessToken = await this.authService.createToken(member);
		return { member, accessToken };
	}

	private async generateNick(name?: string): Promise<string> {
		const base = (name ?? '').replace(/[^a-zA-Z0-9_가-힣]/g, '').slice(0, 7) || 'member';
		while (true) {
			const nick = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
			if (!(await this.memberModel.exists({ memberNick: nick }))) return nick;
		}
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
		if (memberId && memberId.toString() !== targetId.toString()) {
			const newView = await this.viewService.recordView({
				memberId: memberId,
				viewRefId: targetId,
				viewGroup: ViewGroup.MEMBER,
			});
			if (newView) {
				await this.memberStatsEditor({ _id: targetId, targetKey: 'memberViews', modifier: 1 });
				targetMember.memberViews++;
			}
		}
		if (memberId) {
			targetMember.meLiked = await this.likeService.checkLikeExistence({
				memberId: memberId,
				likeRefId: targetId,
				likeGroup: LikeGroup.MEMBER,
			});
			targetMember.meFollowed = await this.followService.checkSubscription(memberId, targetId);
		}
		return targetMember;
	}

	public async subscribe(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<Follower> {
		if (followerId.toString() === followingId.toString())
			throw new BadRequestException(Message.SELF_FOLLOW_DENIED);

		await this.getMember(null, followingId);

		const result = await this.followService.registerSubscription(followerId, followingId);

		await this.memberStatsEditor({
			_id: followerId,
			targetKey: 'memberFollowings',
			modifier: 1,
		});
		await this.memberStatsEditor({
			_id: followingId,
			targetKey: 'memberFollowers',
			modifier: 1,
		});

		return result;
	}

	public async unsubscribe(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<Follower> {
		await this.getMember(null, followingId);

		const result = await this.followService.removeSubscription(followerId, followingId);

		await this.memberStatsEditor({
			_id: followerId,
			targetKey: 'memberFollowings',
			modifier: -1,
		});
		await this.memberStatsEditor({
			_id: followingId,
			targetKey: 'memberFollowers',
			modifier: -1,
		});

		return result;
	}

	public async likeTargetMember(memberId: Types.ObjectId, likeRefId: Types.ObjectId): Promise<Member> {
		if (memberId.toString() === likeRefId.toString())
			throw new BadRequestException(Message.SELF_LIKE_DENIED);

		const target = await this.memberModel
			.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEditor({
			_id: likeRefId,
			targetKey: 'memberLikes',
			modifier: modifier,
		});
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
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
							lookAuthMemberLiked(memberId),
							lookAuthMemberFollowed({ followerId: memberId, followingId: '$_id' }),
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
