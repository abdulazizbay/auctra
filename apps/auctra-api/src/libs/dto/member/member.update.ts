import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { MemberLocation, MemberSellerStatus, MemberStatus } from '../../enums/member.enum';
import { Types } from 'mongoose';

@InputType()
export class MemberUpdate {
	@IsOptional()
	@Field(() => String, { nullable: true })
	_id?: Types.ObjectId;
	
	@IsOptional()
	@Length(3, 12)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@IsEmail()
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberImage?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberBio?: string;

	@IsOptional()
	@Field(() => MemberLocation, { nullable: true })
	memberLocation?: MemberLocation;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@IsIn([MemberStatus.ACTIVE, MemberStatus.BLOCK])
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;
}

@InputType()
export class SellerApply {
	@IsNotEmpty()
	@Field(() => String)
	memberSellerDocUrl!: string;
}

@InputType()
export class SellerStatusUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: Types.ObjectId;

	@IsIn([MemberSellerStatus.APPROVED, MemberSellerStatus.REJECTED])
	@Field(() => MemberSellerStatus)
	memberSellerStatus!: MemberSellerStatus;
}
