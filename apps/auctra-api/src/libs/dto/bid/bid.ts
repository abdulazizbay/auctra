import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Bid {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	lotId!: Types.ObjectId;

	@Field(() => String)
	memberId!: Types.ObjectId;

	@Field(() => Int)
	bidPrice!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Bids {
	@Field(() => [Bid])
	list!: Bid[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
