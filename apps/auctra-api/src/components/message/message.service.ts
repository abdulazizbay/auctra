import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderMessage, OrderMessages } from '../../libs/dto/message/message';
import { MessageInput, MessagesInquiry } from '../../libs/dto/message/message.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { OrderService } from '../order/order.service';

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('Message') private readonly messageModel: Model<OrderMessage>,
		private readonly orderService: OrderService,
	) {}

	public async sendMessage(memberId: Types.ObjectId, input: MessageInput): Promise<OrderMessage> {
		await this.orderService.getOrder(memberId, input.orderId);

		try {
			return await this.messageModel.create({
				orderId: input.orderId,
				memberId: memberId,
				messageText: input.messageText,
			});
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMessages(memberId: Types.ObjectId, input: MessagesInquiry): Promise<OrderMessages> {
		const { page, limit, search } = input;
		await this.orderService.getOrder(memberId, search.orderId);

		const match: T = { orderId: search.orderId };
		const result = await this.messageModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}
}
