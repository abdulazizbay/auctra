import { registerEnumType } from '@nestjs/graphql';

export enum NoticeType {
	NOTICE = 'NOTICE',
	FAQ = 'FAQ',
}
registerEnumType(NoticeType, { name: 'NoticeType' });

export enum NoticeStatus {
	ACTIVE = 'ACTIVE',
	HIDDEN = 'HIDDEN',
}
registerEnumType(NoticeStatus, { name: 'NoticeStatus' });
