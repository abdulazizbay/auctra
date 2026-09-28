import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMaxSize, ArrayNotEmpty, IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Types } from 'mongoose';
import { LotCategory, LotCondition, LotStatus } from '../../enums/lot.enum';

@InputType()
export class LotUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: Types.ObjectId;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	lotName?: string;

	@IsOptional()
	@Length(5, 2000)
	@Field(() => String, { nullable: true })
	lotDesc?: string;

	@IsOptional()
	@ArrayNotEmpty()
	@ArrayMaxSize(10)
	@Field(() => [String], { nullable: true })
	lotImages?: string[];

	@IsOptional()
	@Field(() => LotCategory, { nullable: true })
	lotCategory?: LotCategory;

	@IsOptional()
	@Field(() => LotCondition, { nullable: true })
	lotCondition?: LotCondition;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	lotStartPrice?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	lotCeilingPrice?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	lotMinIncrement?: number;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	lotShippingNote?: string;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	lotStartsAt?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	lotEndsAt?: Date;

	// only cancelling is allowed; SOLD/UNSOLD are set by the batch
	@IsOptional()
	@IsIn([LotStatus.CANCELLED])
	@Field(() => LotStatus, { nullable: true })
	lotStatus?: LotStatus;
}
