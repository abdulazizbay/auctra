import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMaxSize, ArrayNotEmpty, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { LotCategory, LotCondition } from '../../enums/lot.enum';

@InputType()
export class LotInput {
	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	lotName!: string;

	@IsOptional()
	@Length(5, 2000)
	@Field(() => String, { nullable: true })
	lotDesc?: string;

	@ArrayNotEmpty()
	@ArrayMaxSize(10)
	@Field(() => [String])
	lotImages!: string[];

	@IsNotEmpty()
	@Field(() => LotCategory)
	lotCategory!: LotCategory;

	@IsNotEmpty()
	@Field(() => LotCondition)
	lotCondition!: LotCondition;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	lotStartPrice!: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	lotCeilingPrice?: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	lotMinIncrement!: number;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	lotShippingNote?: string;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	lotStartsAt?: Date;

	@IsNotEmpty()
	@Field(() => Date)
	lotEndsAt!: Date;
}
