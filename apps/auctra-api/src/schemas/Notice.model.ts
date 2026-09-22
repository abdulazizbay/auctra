import { Schema } from 'mongoose';
import { NoticeStatus, NoticeType } from '../libs/enums/notice.enum';

const NoticeSchema = new Schema(
	{
		noticeTitle: {
			type: String,
			required: true,
		},

		noticeContent: {
			type: String,
			required: true,
		},

		noticeType: {
			type: String,
			enum: NoticeType,
			required: true,
		},

		noticeStatus: {
			type: String,
			enum: NoticeStatus,
			default: NoticeStatus.ACTIVE,
		},

		noticeOrder: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'notices' },
);

NoticeSchema.index({ noticeType: 1, noticeOrder: 1 });

export default NoticeSchema;
