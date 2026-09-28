import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { Member, Members } from '../../libs/dto/member/member';
import {
	LoginInput,
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
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}
	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		console.log('Mutation: signup');
		return await this.memberService.signup(input);
	}
	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		console.log('Mutation: login');
		return await this.memberService.login(input);
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

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async applySeller(
		@AuthMember('_id') memberId: Types.ObjectId,
		@Args('input') input: SellerApply,
	): Promise<Member> {
		console.log('Mutation: applySeller');
		return await this.memberService.applySeller(memberId, input);
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
