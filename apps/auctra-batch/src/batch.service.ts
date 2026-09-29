import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Lot } from 'apps/auctra-api/src/libs/dto/lot/lot';
import { LotStatus } from 'apps/auctra-api/src/libs/enums/lot.enum';
import { OrderStatus } from 'apps/auctra-api/src/libs/enums/order.enum';
import { Order, OrderItem } from 'apps/auctra-api/src/libs/dto/order/order';
import { ORDER_PAYMENT_WINDOW } from './lib/config';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Lot') private readonly lotModel: Model<Lot>,
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
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
				await this.connection.transaction(async (session) => {
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
					if (!lot || lot.lotStatus !== LotStatus.SOLD) return;

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
				});
			} catch (err) {
				console.log('Error, batchCloseLots:', _id, err);
			}
		}
	}

	public async batchExpireOrders(): Promise<void> {
		await this.orderModel
			.updateMany(
				{ orderStatus: OrderStatus.PENDING_PAYMENT, orderPaymentDueAt: { $lte: new Date() } },
				{ orderStatus: OrderStatus.EXPIRED },
			)
			.exec();
	}

	getHello(): string {
		return 'Welcome to Auctra BATCH Server!';
	}
}
