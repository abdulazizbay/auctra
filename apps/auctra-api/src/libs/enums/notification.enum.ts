import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	OUTBID = 'OUTBID',
	ENDING_SOON = 'ENDING_SOON',
	WON = 'WON',
	LOST = 'LOST',
	PAYMENT_DUE = 'PAYMENT_DUE',
	PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
	SHIPPED = 'SHIPPED',
	ORDER_COMPLETED = 'ORDER_COMPLETED',
	NEW_COMMENT = 'NEW_COMMENT',
	NEW_MESSAGE = 'NEW_MESSAGE',
	NEW_LOT_FROM_FOLLOWED = 'NEW_LOT_FROM_FOLLOWED',
	NEW_ARTICLE_FROM_FOLLOWED = 'NEW_ARTICLE_FROM_FOLLOWED',
	SELLER_APPROVED = 'SELLER_APPROVED',
	SELLER_REJECTED = 'SELLER_REJECTED',
	LOT_CANCELLED = 'LOT_CANCELLED',
}
registerEnumType(NotificationType, { name: 'NotificationType' });

export enum NotificationRefType {
	LOT = 'LOT',
	ORDER = 'ORDER',
	ARTICLE = 'ARTICLE',
	MEMBER = 'MEMBER',
}
registerEnumType(NotificationRefType, { name: 'NotificationRefType' });
