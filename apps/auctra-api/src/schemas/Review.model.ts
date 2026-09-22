import { Schema } from 'mongoose';

const ReviewSchema = new Schema(
	{
		orderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Order',
		},

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

		reviewRating: {
			type: Number,
			min: 1,
			max: 5,
			required: true,
		},

		reviewText: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'reviews' },
);

ReviewSchema.index({ orderId: 1 }, { unique: true });

export default ReviewSchema;
