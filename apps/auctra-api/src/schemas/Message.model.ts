import { Schema } from 'mongoose';

const MessageSchema = new Schema(
	{
		orderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Order',
		},

		/** The sender. The order already knows the two participants. */
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		messageText: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true, collection: 'messages' },
);


export default MessageSchema;
