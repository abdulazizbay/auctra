import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Review {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	orderId!: Types.ObjectId;

	@Field(() => String)
	buyerId!: Types.ObjectId;

	@Field(() => String)
	sellerId!: Types.ObjectId;

	@Field(() => Int)
	reviewRating!: number;

	@Field(() => String, { nullable: true })
	reviewText?: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	buyerData?: Member;
}

@ObjectType()
export class Reviews {
	@Field(() => [Review])
	list!: Review[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
