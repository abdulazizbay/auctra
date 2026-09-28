import { registerEnumType } from '@nestjs/graphql';

export enum LotCategory {
	WATCHES = 'WATCHES',
	JEWELLERY = 'JEWELLERY',
	ART = 'ART',
	COINS = 'COINS',
	ELECTRONICS = 'ELECTRONICS',
	COLLECTIBLES = 'COLLECTIBLES',
	OTHER = 'OTHER',
}
registerEnumType(LotCategory, { name: 'LotCategory' });

export enum LotCondition {
	NEW = 'NEW',
	LIKE_NEW = 'LIKE_NEW',
	USED = 'USED',
	FOR_PARTS = 'FOR_PARTS',
}
registerEnumType(LotCondition, { name: 'LotCondition' });

export enum LotStatus {
	SCHEDULED = 'SCHEDULED',
	OPEN = 'OPEN',
	SOLD = 'SOLD',
	UNSOLD = 'UNSOLD',
	CANCELLED = 'CANCELLED',
}
registerEnumType(LotStatus, { name: 'LotStatus' });

export const publicLotStatuses = [LotStatus.SCHEDULED, LotStatus.OPEN, LotStatus.SOLD, LotStatus.UNSOLD];
