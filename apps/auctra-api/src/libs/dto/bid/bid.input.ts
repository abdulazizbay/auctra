import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { Types } from 'mongoose';

@InputType()
export class BidInput {
	@IsNotEmpty()
	@Field(() => String)
	lotId!: Types.ObjectId;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	bidPrice!: number;
}

@InputType()
class BidSearch {
	@IsNotEmpty()
	@Field(() => String)
	lotId!: Types.ObjectId;
}

@InputType()
export class BidsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsNotEmpty()
	@Field(() => BidSearch)
	search!: BidSearch;
}
