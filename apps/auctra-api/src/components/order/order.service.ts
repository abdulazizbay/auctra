import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Order, Orders } from '../../libs/dto/order/order';
import { OrdersInquiry } from '../../libs/dto/order/order.input';
import { OrderUpdate } from '../../libs/dto/order/order.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { lookupOrderItems, lookupOrderLots, lookupOrderReviewed } from '../../libs/config';
import { T } from '../../libs/types/common';
import { NotificationRefType, NotificationType } from '../../libs/enums/notification.enum';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectConnection() private readonly connection: Connection,
		private readonly memberService: MemberService,
		private readonly notificationService: NotificationService,
	) {}

	public async getMyOrders(memberId: Types.ObjectId, input: OrdersInquiry): Promise<Orders> {
		const match: T = { buyerId: memberId };
		if (input.search.orderStatus) match.orderStatus = input.search.orderStatus;

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupOrderItems,
							lookupOrderLots,
							...lookupOrderReviewed,
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async getMySales(memberId: Types.ObjectId, input: OrdersInquiry): Promise<Orders> {
		const match: T = { sellerId: memberId };
		if (input.search.orderStatus) match.orderStatus = input.search.orderStatus;

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupOrderItems,
							lookupOrderLots,
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async getOrder(memberId: Types.ObjectId, orderId: Types.ObjectId): Promise<Order> {
		const result = await this.orderModel
			.aggregate([
				{ $match: { _id: orderId, $or: [{ buyerId: memberId }, { sellerId: memberId }] } },
				lookupOrderItems,
				lookupOrderLots,
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateOrder(memberId: Types.ObjectId, input: OrderUpdate): Promise<Order> {
		const { _id, orderStatus, orderAddress } = input;
		const match: T = { _id };
		const update: T = { orderStatus };
		let notificationType: NotificationType;

		if (orderStatus === OrderStatus.PAID) {
			if (!orderAddress) throw new BadRequestException(Message.ORDER_ADDRESS_REQUIRED);
			match.buyerId = memberId;
			match.orderStatus = OrderStatus.PENDING_PAYMENT;
			match.orderPaymentDueAt = { $gt: new Date() };
			update.orderAddress = orderAddress;
			notificationType = NotificationType.PAYMENT_RECEIVED;
		} else if (orderStatus === OrderStatus.SHIPPED) {
			match.sellerId = memberId;
			match.orderStatus = OrderStatus.PAID;
			notificationType = NotificationType.SHIPPED;
		} else {
			match.buyerId = memberId;
			match.orderStatus = OrderStatus.SHIPPED;
			notificationType = NotificationType.ORDER_COMPLETED;
		}

		const { result, notification } = await this.connection.transaction(async (session) => {
			const result = await this.orderModel
				.findOneAndUpdate(match, update, { new: true, session })
				.exec();
			if (!result) throw new BadRequestException(Message.UPDATE_FAILED);

			if (orderStatus === OrderStatus.COMPLETED) {
				await this.memberService.memberStatsEditor(
					{ _id: result.sellerId, targetKey: 'memberSalesCount', modifier: 1 },
					session,
				);
			}

			const notification = await this.notificationService.createNotification(
				{
					memberId: orderStatus === OrderStatus.SHIPPED ? result.buyerId : result.sellerId,
					notificationType: notificationType,
					notificationRefId: result._id,
					notificationRefType: NotificationRefType.ORDER,
					notificationPayload: { price: result.orderTotal },
				},
				session,
			);
			return { result, notification };
		});

		this.notificationService.pushNotification(notification);
		return result;
	}
}
