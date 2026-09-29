import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { Types } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: Types.ObjectId;

	// buyer: PAID, COMPLETED; seller: SHIPPED
	@IsIn([OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED])
	@Field(() => OrderStatus)
	orderStatus!: OrderStatus;

	@IsOptional()
	@Length(5, 200)
	@Field(() => String, { nullable: true })
	orderAddress?: string;
}
