import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { OrderStatus } from '../../enums/order.enum';

@InputType()
class OISearch {
	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;
}

@InputType()
export class OrdersInquiry {
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
	@Field(() => OISearch)
	search!: OISearch;
}
