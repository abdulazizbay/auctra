import { Field, InputType, Int } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	ArrayNotEmpty,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	Length,
	Max,
	Min,
} from 'class-validator';
import { LotCategory, LotCondition, LotStatus, publicLotStatuses } from '../../enums/lot.enum';
import { availableLotSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

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

@InputType()
class PricesRange {
	@IsInt()
	@Min(0)
	@Field(() => Int)
	start!: number;

	@IsInt()
	@Min(0)
	@Field(() => Int)
	end!: number;
}

@InputType()
class LISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsIn(publicLotStatuses, { each: true })
	@Field(() => [LotStatus], { nullable: true })
	lotStatusList?: LotStatus[];

	@IsOptional()
	@Field(() => [LotCategory], { nullable: true })
	lotCategoryList?: LotCategory[];

	@IsOptional()
	@Field(() => [LotCondition], { nullable: true })
	lotConditionList?: LotCondition[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class LotsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableLotSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => LISearch)
	search!: LISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;
}
