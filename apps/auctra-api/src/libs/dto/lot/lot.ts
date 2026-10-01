import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { LotCategory, LotCondition, LotStatus } from '../../enums/lot.enum';
import { Member, TotalCounter } from '../member/member';
import { MeWatched } from '../watch/watch';

@ObjectType()
export class Lot {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	memberId!: Types.ObjectId;

	@Field(() => String)
	lotName!: string;

	@Field(() => String, { nullable: true })
	lotDesc?: string;

	@Field(() => [String])
	lotImages!: string[];

	@Field(() => LotCategory)
	lotCategory!: LotCategory;

	@Field(() => LotCondition)
	lotCondition!: LotCondition;

	@Field(() => LotStatus)
	lotStatus!: LotStatus;

	@Field(() => Int)
	lotStartPrice!: number;

	@Field(() => Int)
	lotCurrentPrice!: number;

	@Field(() => Int, { nullable: true })
	lotCeilingPrice?: number;

	@Field(() => Int)
	lotMinIncrement!: number;

	@Field(() => String, { nullable: true })
	lotHighestBidderId?: Types.ObjectId;

	@Field(() => Int)
	lotBids!: number;

	@Field(() => Int)
	lotWatchers!: number;

	@Field(() => Int)
	lotViews!: number;

	@Field(() => Int)
	lotComments!: number;

	@Field(() => String, { nullable: true })
	lotShippingNote?: string;

	@Field(() => Date)
	lotStartsAt!: Date;

	@Field(() => Date)
	lotEndsAt!: Date;

	@Field(() => Date, { nullable: true })
	lotClosedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => [MeWatched], { nullable: true })
	meWatched?: MeWatched[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Lots {
	@Field(() => [Lot])
	list!: Lot[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
