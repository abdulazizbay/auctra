import { Schema } from 'mongoose';

const WatchSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		lotId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Lot',
		},
	},
	{ timestamps: true, collection: 'watches' },
);

WatchSchema.index({ memberId: 1, lotId: 1 }, { unique: true });

export default WatchSchema;
