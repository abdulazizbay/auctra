import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { OrderMessage, OrderMessages } from '../../libs/dto/message/message';
import { MessageInput, MessagesInquiry } from '../../libs/dto/message/message.input';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MessageService } from './message.service';

@Resolver()
export class MessageResolver {
	constructor(private readonly messageService: MessageService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => OrderMessage)
	public async sendMessage(
		@Args('input') input: MessageInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<OrderMessage> {
		console.log('Mutation: sendMessage');
		input.orderId = shapeIntoMongoObjectId(input.orderId);
		return await this.messageService.sendMessage(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => OrderMessages)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<OrderMessages> {
		console.log('Query: getMessages');
		input.search.orderId = shapeIntoMongoObjectId(input.search.orderId);
		return await this.messageService.getMessages(memberId, input);
	}
}
