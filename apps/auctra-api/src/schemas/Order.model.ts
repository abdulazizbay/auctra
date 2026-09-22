import { Schema } from 'mongoose';
import { OrderStatus } from '../libs/enums/order.enum';

const OrderSchema = new Schema(
	{
		buyerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		sellerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		orderTotal: {
			type: Number,
			required: true,
		},

		orderStatus: {
			type: String,
			enum: OrderStatus,
			default: OrderStatus.PENDING_PAYMENT,
		},

		orderAddress: {
			type: String,
		},

		orderPaymentDueAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true, collection: 'orders' },
);

/** The expiry job. */
OrderSchema.index({ orderStatus: 1, orderPaymentDueAt: 1 });

export default OrderSchema;
