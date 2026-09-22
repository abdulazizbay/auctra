import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	LOT = 'LOT',
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
}
registerEnumType(ViewGroup, { name: 'ViewGroup' });
