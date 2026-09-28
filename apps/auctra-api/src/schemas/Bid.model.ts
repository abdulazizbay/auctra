import { Schema } from 'mongoose';

const BidSchema = new Schema(
	{
		lotId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Lot',
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		bidPrice: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true, collection: 'bids' },
);


BidSchema.index({ lotId: 1, bidPrice: -1 });

export default BidSchema;
