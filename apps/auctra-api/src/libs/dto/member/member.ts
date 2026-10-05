import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { MeLiked } from '../like/like';
import { MeFollowed } from '../follow/follow';
import {
	MemberAuthType,
	MemberLocation,
	MemberSellerStatus,
	MemberStatus,
	MemberType,
} from '../../enums/member.enum';

@ObjectType()
export class Member {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	memberNick!: string;

	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@Field(() => String, { nullable: true })
	memberEmail?: string;

	memberPassword?: string;

	memberAuthType!: MemberAuthType;

	memberSocialId?: string;

	@Field(() => MemberType)
	memberType!: MemberType;

	@Field(() => MemberStatus)
	memberStatus!: MemberStatus;

	@Field(() => MemberSellerStatus)
	memberSellerStatus!: MemberSellerStatus;

	@Field(() => String)
	memberImage!: string;

	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@Field(() => String, { nullable: true })
	memberBio?: string;

	@Field(() => MemberLocation, { nullable: true })
	memberLocation?: MemberLocation;

	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@Field(() => String, { nullable: true })
	memberSellerDocUrl?: string;

	@Field(() => Date, { nullable: true })
	memberSellerAppliedAt?: Date;

	@Field(() => Float)
	memberAvgRating!: number;

	@Field(() => Int)
	memberReviewCount!: number;

	@Field(() => Int)
	memberSalesCount!: number;

	@Field(() => Int)
	memberFollowers!: number;

	@Field(() => Int)
	memberFollowings!: number;

	@Field(() => Int)
	memberLikes!: number;

	@Field(() => Int)
	memberViews!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => [MeFollowed], { nullable: true })
	meFollowed?: MeFollowed[];
}

@ObjectType()
export class AuthResponse {
	@Field(() => Member)
	member!: Member;

	@Field(() => String)
	accessToken!: string;
}

@ObjectType()
export class Members {
	@Field(() => [Member])
	list!: Member[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}

@ObjectType()
export class TotalCounter {
	@Field(() => Int, { nullable: true })
	total?: number;
}
