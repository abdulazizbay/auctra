import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { AuthResponse, Member, Members } from '../../libs/dto/member/member';
import { Follower } from '../../libs/dto/follow/follow';
import {
	LoginInput,
	SocialLoginInput,
	MemberInput,
	MembersInquiry,
	SellersInquiry,
} from '../../libs/dto/member/member.input';
import { InternalServerErrorException, UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Types } from 'mongoose';
import {
	MemberUpdate,
	SellerApply,
	SellerStatusUpdate,
} from '../../libs/dto/member/member.update';
import { WithoutGuard } from '../auth/guards/without.guard';
import { getSerialForImage, shapeIntoMongoObjectId, validMimeTypes } from '../../libs/config';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream } from 'fs';
import { Message } from '../../libs/enums/common.enum';
import { Throttle, hours, minutes } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '../auth/guards/gql-throttler.guard';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}
	@UseGuards(GqlThrottlerGuard)
	@Throttle({ default: { limit: 3, ttl: minutes(10) } })
	@Mutation(() => AuthResponse)
	public async signup(@Args('input') input: MemberInput): Promise<AuthResponse> {
		console.log('Mutation: signup');
		return await this.memberService.signup(input);
	}
	@UseGuards(GqlThrottlerGuard)
	@Throttle({ default: { limit: 5, ttl: minutes(1) } })
	@Mutation(() => AuthResponse)
	public async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
		console.log('Mutation: login');
		return await this.memberService.login(input);
	}

	@UseGuards(GqlThrottlerGuard)
	@Throttle({ default: { limit: 10, ttl: minutes(1) } })
	@Mutation(() => AuthResponse)
	public async socialLogin(@Args('input') input: SocialLoginInput): Promise<AuthResponse> {
		console.log('Mutation: socialLogin');
		return await this.memberService.socialLogin(input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Member)
	public async getMe(@AuthMember() authMember: Member): Promise<Member> {
		console.log('Query: getMe');
		return authMember;
	}

	@Roles(MemberType.USER, MemberType.SELLER, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member) {
		console.log('Query: checkAuthRoles');
		return `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@AuthMember('_id') memberId: Types.ObjectId,
		@Args('input') input: MemberUpdate,
	) {
		console.log('Mutation: updateMember');
		delete input._id;
		delete input.memberStatus;
		return await this.memberService.updateMember(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(
		@AuthMember('_id') memberId: Types.ObjectId,
		@Args('memberId') input: string,
	) {
		console.log('Query: getMember');
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getSellers(
		@Args('input') input: SellersInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Members> {
		console.log('Query: getSellers');
		return await this.memberService.getSellers(memberId, input);
	}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 30, ttl: minutes(1) } })
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Member> {
		console.log('Mutation: likeTargetMember');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 30, ttl: minutes(1) } })
	@Mutation(() => Follower)
	public async subscribe(
		@Args('input') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Follower> {
		console.log('Mutation: subscribe');
		const followingId = shapeIntoMongoObjectId(input);
		return await this.memberService.subscribe(memberId, followingId);
	}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 30, ttl: minutes(1) } })
	@Mutation(() => Follower)
	public async unsubscribe(
		@Args('input') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Follower> {
		console.log('Mutation: unsubscribe');
		const followingId = shapeIntoMongoObjectId(input);
		return await this.memberService.unsubscribe(memberId, followingId);
	}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 3, ttl: hours(1) } })
	@Mutation(() => Member)
	public async applySeller(
		@AuthMember('_id') memberId: Types.ObjectId,
		@Args('input') input: SellerApply,
	): Promise<Member> {
		console.log('Mutation: applySeller');
		return await this.memberService.applySeller(memberId, input);
	}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 20, ttl: minutes(1) } })
	@Mutation(() => String)
	public async imageUploader(
		@Args({ name: 'file', type: () => GraphQLUpload })
		{ createReadStream, filename, mimetype }: FileUpload,
		@Args('target') target: String,
	): Promise<string> {
		console.log('Mutation: imageUploader');

		if (!filename) throw new Error(Message.UPLOAD_FAILED);
		const validMime = validMimeTypes.includes(mimetype);
		if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

		const imageName = getSerialForImage(filename);
		const url = `uploads/${target}/${imageName}`;
		const stream = createReadStream();

		const result = await new Promise((resolve, reject) => {
			stream
				.pipe(createWriteStream(url))
				.on('finish', async () => resolve(true))
				.on('error', () => reject(false));
		});
		if (!result) throw new Error(Message.UPLOAD_FAILED);

		return url;
	}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 20, ttl: minutes(1) } })
	@Mutation(() => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: String,
	): Promise<string[]> {
		console.log('Mutation: imagesUploader');

		const uploadedImages: string[] = [];
		const promisedList = files.map(async (img: Promise<FileUpload>, index: number): Promise<Promise<void>> => {
			try {
				const { filename, mimetype, encoding, createReadStream } = await img;

				const validMime = validMimeTypes.includes(mimetype);
				if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

				const imageName = getSerialForImage(filename);
				const url = `uploads/${target}/${imageName}`;
				const stream = createReadStream();

				const result = await new Promise((resolve, reject) => {
					stream
						.pipe(createWriteStream(url))
						.on('finish', () => resolve(true))
						.on('error', () => reject(false));
				});
				if (!result) throw new Error(Message.UPLOAD_FAILED);

				uploadedImages[index] = url;
			} catch (err) {
				console.log('Error, file missing!');
			}
		});

		await Promise.all(promisedList);
		return uploadedImages;
	}

	// Admin

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(
		@Args('input') input: MembersInquiry,
	): Promise<Members> {
		console.log('Query: getAllMembersByAdmin');
		return await this.memberService.getAllMembersByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateMemberByAdmin(
		@Args('input') input: MemberUpdate,
	): Promise<Member> {
		console.log('Mutation: updateMemberByAdmin');
		return await this.memberService.updateMemberByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateSellerStatusByAdmin(
		@Args('input') input: SellerStatusUpdate,
	): Promise<Member> {
		console.log('Mutation: updateSellerStatusByAdmin');
		return await this.memberService.updateSellerStatusByAdmin(input);
	}
}
