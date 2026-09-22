import { Schema } from 'mongoose';

const FollowSchema = new Schema(
	{
		followerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		followingId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'follows' },
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default FollowSchema;
