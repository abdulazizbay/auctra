import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import {
	LoginInput,
	MemberInput,
	MembersInquiry,
	SellersInquiry,
} from '../../libs/dto/member/member.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { T } from '../../libs/types/common';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private authService: AuthService,
	) {}
	public async signup(input: MemberInput): Promise<Member> {
		input.memberPassword = await this.authService.hashPassword(
			input.memberPassword,
		);
		try {
			const result = await this.memberModel.create(input);
			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err) {
			console.log('Error, member service: ', err);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}
	public async login(input: LoginInput): Promise<Member> {
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
		response.accessToken = await this.authService.createToken(response);
		return response;
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
		result.accessToken = await this.authService.createToken(result);
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
}
