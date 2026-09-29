import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, Length, Max, Min } from 'class-validator';
import { Types } from 'mongoose';

@InputType()
export class MessageInput {
	@IsNotEmpty()
	@Field(() => String)
	orderId!: Types.ObjectId;

	@IsNotEmpty()
	@Length(1, 1000)
	@Field(() => String)
	messageText!: string;
}

@InputType()
class MSearch {
	@IsNotEmpty()
	@Field(() => String)
	orderId!: Types.ObjectId;
}

@InputType()
export class MessagesInquiry {
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
	@Field(() => MSearch)
	search!: MSearch;
}
