import { Schema } from 'mongoose';
import { CommentGroup, CommentStatus } from '../libs/enums/comment.enum';

const CommentSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		commentRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		commentGroup: {
			type: String,
			enum: CommentGroup,
			required: true,
		},

		commentText: {
			type: String,
			required: true,
		},

		commentStatus: {
			type: String,
			enum: CommentStatus,
			default: CommentStatus.ACTIVE,
		},
	},
	{ timestamps: true, collection: 'comments' },
);


export default CommentSchema;
