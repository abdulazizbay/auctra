import { Schema } from 'mongoose';
import { ViewGroup } from '../libs/enums/view.enum';

const ViewSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		viewRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		viewGroup: {
			type: String,
			enum: ViewGroup,
			required: true,
		},
	},
	{ timestamps: true, collection: 'views' },
);

ViewSchema.index({ memberId: 1, viewRefId: 1 }, { unique: true });
/** Recently Viewed  */
ViewSchema.index({ memberId: 1, updatedAt: -1 });

export default ViewSchema;
