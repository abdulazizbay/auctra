import { Schema } from 'mongoose';
import { LikeGroup } from '../libs/enums/like.enum';

const LikeSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		likeRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		likeGroup: {
			type: String,
			enum: LikeGroup,
			required: true,
		},
	},
	{ timestamps: true, collection: 'likes' },
);

LikeSchema.index({ memberId: 1, likeRefId: 1 }, { unique: true });

export default LikeSchema;
