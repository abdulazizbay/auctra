import { Schema } from 'mongoose';
import {
	NotificationRefType,
	NotificationType,
} from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
	{
		/** The recipient. */
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		notificationType: {
			type: String,
			enum: NotificationType,
			required: true,
		},

		notificationRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		notificationRefType: {
			type: String,
			enum: NotificationRefType,
			required: true,
		},

		notificationPayload: {
			type: Object,
		},
		notificationReadAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ memberId: 1, createdAt: -1 });

export default NotificationSchema;
