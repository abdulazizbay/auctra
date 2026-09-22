import { Schema } from 'mongoose';
import { LotCategory, LotCondition, LotStatus } from '../libs/enums/lot.enum';

const LotSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		lotName: {
			type: String,
			required: true,
		},

		lotDesc: {
			type: String,
		},

		lotImages: {
			type: [String],
			required: true,
		},

		lotCategory: {
			type: String,
			enum: LotCategory,
			required: true,
		},

		lotCondition: {
			type: String,
			enum: LotCondition,
			required: true,
		},

		lotStatus: {
			type: String,
			enum: LotStatus,
			default: LotStatus.OPEN,
		},

		lotStartPrice: {
			type: Number,
			required: true,
		},

		lotCurrentPrice: {
			type: Number,
			required: true,
		},

		lotCeilingPrice: {
			type: Number,
		},

		lotMinIncrement: {
			type: Number,
			required: true,
		},

		lotHighestBidderId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		lotBids: {
			type: Number,
			default: 0,
		},

		lotWatchers: {
			type: Number,
			default: 0,
		},

		lotViews: {
			type: Number,
			default: 0,
		},

		lotComments: {
			type: Number,
			default: 0,
		},

		lotShippingNote: {
			type: String,
		},

		lotStartsAt: {
			type: Date,
			required: true,
		},

		lotEndsAt: {
			type: Date,
			required: true,
		},

		lotClosedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'lots' },
);

/** The batch closing query */
LotSchema.index({ lotStatus: 1, lotEndsAt: 1 });

export default LotSchema;
