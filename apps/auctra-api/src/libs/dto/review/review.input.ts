import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { Types } from 'mongoose';

@InputType()
export class ReviewInput {
	@IsNotEmpty()
	@Field(() => String)
	orderId!: Types.ObjectId;

	@IsInt()
	@Min(1)
	@Max(5)
	@Field(() => Int)
	reviewRating!: number;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	reviewText?: string;
}

@InputType()
class RISearch {
	@IsNotEmpty()
	@Field(() => String)
	sellerId!: Types.ObjectId;
}

@InputType()
export class ReviewsInquiry {
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
	@Field(() => RISearch)
	search!: RISearch;
}
