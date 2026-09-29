import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderMessage, OrderMessages } from '../../libs/dto/message/message';
import { MessageInput, MessagesInquiry } from '../../libs/dto/message/message.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { NotificationRefType, NotificationType } from '../../libs/enums/notification.enum';
import { OrderService } from '../order/order.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('Message') private readonly messageModel: Model<OrderMessage>,
		private readonly orderService: OrderService,
		private readonly notificationService: NotificationService,
	) {}

	public async sendMessage(memberId: Types.ObjectId, input: MessageInput): Promise<OrderMessage> {
		const order = await this.orderService.getOrder(memberId, input.orderId);

		let result: OrderMessage;
		try {
			result = await this.messageModel.create({
				orderId: input.orderId,
				memberId: memberId,
				messageText: input.messageText,
			});
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		await this.notificationService.createNotification({
			memberId: order.buyerId.toString() === memberId.toString() ? order.sellerId : order.buyerId,
			notificationType: NotificationType.NEW_MESSAGE,
			notificationRefId: order._id,
			notificationRefType: NotificationRefType.ORDER,
			notificationPayload: { text: input.messageText.slice(0, 100) },
		});
		return result;
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
