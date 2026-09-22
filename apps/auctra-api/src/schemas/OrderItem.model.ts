import { Schema } from 'mongoose';

const OrderItemSchema = new Schema(
	{
		orderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Order',
		},

		lotId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Lot',
		},

		itemPrice: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true, collection: 'orderItems' },
);

OrderItemSchema.index({ lotId: 1 }, { unique: true });

export default OrderItemSchema;
