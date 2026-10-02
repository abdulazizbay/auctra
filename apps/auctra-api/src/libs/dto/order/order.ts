import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';
import { Lot } from '../lot/lot';
import { TotalCounter } from '../member/member';

@ObjectType()
export class OrderItem {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	orderId!: Types.ObjectId;

	@Field(() => String)
	lotId!: Types.ObjectId;

	@Field(() => Int)
	itemPrice!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class Order {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	buyerId!: Types.ObjectId;

	@Field(() => String)
	sellerId!: Types.ObjectId;

	@Field(() => Int)
	orderTotal!: number;

	@Field(() => OrderStatus)
	orderStatus!: OrderStatus;

	@Field(() => String, { nullable: true })
	orderAddress?: string;

	@Field(() => Date)
	orderPaymentDueAt!: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => [OrderItem], { nullable: true })
	orderItems?: OrderItem[];

	@Field(() => [Lot], { nullable: true })
	lotData?: Lot[];

	@Field(() => Boolean, { nullable: true })
	orderReviewed?: boolean;
}

@ObjectType()
export class Orders {
	@Field(() => [Order])
	list!: Order[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
