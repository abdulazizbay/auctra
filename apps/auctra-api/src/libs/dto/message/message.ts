import { Field, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { TotalCounter } from '../member/member';

@ObjectType()
export class OrderMessage {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	orderId!: Types.ObjectId;

	@Field(() => String)
	memberId!: Types.ObjectId;

	@Field(() => String)
	messageText!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class OrderMessages {
	@Field(() => [OrderMessage])
	list!: OrderMessage[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
