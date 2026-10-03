import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Lot } from 'apps/auctra-api/src/libs/dto/lot/lot';
import { LotStatus } from 'apps/auctra-api/src/libs/enums/lot.enum';
import { OrderStatus } from 'apps/auctra-api/src/libs/enums/order.enum';
import { Order, OrderItem } from 'apps/auctra-api/src/libs/dto/order/order';
import { Notification } from 'apps/auctra-api/src/libs/dto/notification/notification';
import { Bid } from 'apps/auctra-api/src/libs/dto/bid/bid';
import {
	NotificationRefType,
	NotificationType,
} from 'apps/auctra-api/src/libs/enums/notification.enum';
import { T } from 'apps/auctra-api/src/libs/types/common';
import { ORDER_PAYMENT_WINDOW } from './lib/config';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Lot') private readonly lotModel: Model<Lot>,
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		@InjectModel('Notification')
		private readonly notificationModel: Model<Notification>,
		@InjectModel('Bid') private readonly bidModel: Model<Bid>,
		@InjectConnection() private readonly connection: Connection,
	) {}

	public async batchOpenLots(): Promise<void> {
		await this.lotModel
			.updateMany(
				{ lotStatus: LotStatus.SCHEDULED, lotStartsAt: { $lte: new Date() } },
				{ lotStatus: LotStatus.OPEN },
			)
			.exec();
	}

	public async batchCloseLots(): Promise<void> {
		const lots = await this.lotModel
			.find({ lotStatus: LotStatus.OPEN, lotEndsAt: { $lte: new Date() } })
			.select('_id')
			.lean()
			.exec();

		for (const { _id } of lots) {
			try {
				const closed = await this.connection.transaction(async (session) => {
					const now = new Date();
					const lot = await this.lotModel
						.findOneAndUpdate(
							{ _id, lotStatus: LotStatus.OPEN, lotEndsAt: { $lte: now } },
							[
								{
									$set: {
										lotStatus: {
											$cond: [
												{ $gt: ['$lotBids', 0] },
												LotStatus.SOLD,
												LotStatus.UNSOLD,
											],
										},
										lotClosedAt: now,
									},
								},
							],
							{ new: true, session },
						)
						.exec();
					if (!lot) return null;
					if (lot.lotStatus !== LotStatus.SOLD)
						return { lot, notification: null };

					const order = await this.orderModel
						.findOneAndUpdate(
							{
								buyerId: lot.lotHighestBidderId,
								sellerId: lot.memberId,
								orderStatus: OrderStatus.PENDING_PAYMENT,
							},
							{
								$inc: { orderTotal: lot.lotCurrentPrice },
								$set: {
									orderPaymentDueAt: new Date(
										now.getTime() + ORDER_PAYMENT_WINDOW,
									),
								},
							},
							{ upsert: true, new: true, session },
						)
						.exec();

					await this.orderItemModel.create(
						[
							{
								orderId: order._id,
								lotId: lot._id,
								itemPrice: lot.lotCurrentPrice,
							},
						],
						{ session },
					);

					const [notification] = await this.notificationModel.create(
						[
							{
								memberId: lot.lotHighestBidderId,
								notificationType: NotificationType.WON,
								notificationRefId: lot._id,
								notificationRefType: NotificationRefType.LOT,
								notificationPayload: {
									lotName: lot.lotName,
									price: lot.lotCurrentPrice,
								},
							},
						],
						{ session },
					);
					return { lot, notification };
				});
				if (!closed) continue;

				const { lot, notification } = closed;
				await this.emitToRoom(`lot:${lot._id}`, {
					event: 'lotClosed',
					lotId: lot._id,
					lotStatus: lot.lotStatus,
					lotCurrentPrice: lot.lotCurrentPrice,
					lotHighestBidderId: lot.lotHighestBidderId,
					lotClosedAt: lot.lotClosedAt,
				});
				if (!notification) continue;
				await this.emitToRoom(`member:${notification.memberId}`, {
					event: 'notification',
					notification: notification,
				});

				const loserIds = await this.bidModel
					.distinct('memberId', {
						lotId: lot._id,
						memberId: { $ne: lot.lotHighestBidderId },
					})
					.exec();
				const losts = await this.notificationModel.insertMany(
					loserIds.map((memberId) => ({
						memberId: memberId,
						notificationType: NotificationType.LOST,
						notificationRefId: lot._id,
						notificationRefType: NotificationRefType.LOT,
						notificationPayload: {
							lotName: lot.lotName,
							price: lot.lotCurrentPrice,
						},
					})),
				);
				for (const lost of losts)
					await this.emitToRoom(`member:${lost.memberId}`, {
						event: 'notification',
						notification: lost,
					});
			} catch (err) {
				console.log('Error, batchCloseLots:', _id, err);
			}
		}
	}

	// send to api
	private async emitToRoom(room: string, message: T): Promise<void> {
		try {
			await fetch(`http://localhost:${process.env.PORT_API}/socket/emit`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-batch-secret': process.env.SECRET_TOKEN as string,
				},
				body: JSON.stringify({ room, message }),
			});
		} catch (err) {
			console.log('Error, emitToRoom:', room, err);
		}
	}

	public async batchExpireOrders(): Promise<void> {
		await this.orderModel
			.updateMany(
				{
					orderStatus: OrderStatus.PENDING_PAYMENT,
					orderPaymentDueAt: { $lte: new Date() },
				},
				{ orderStatus: OrderStatus.EXPIRED },
			)
			.exec();
	}

	getHello(): string {
		return 'Welcome to Auctra BATCH Server!';
	}
}
