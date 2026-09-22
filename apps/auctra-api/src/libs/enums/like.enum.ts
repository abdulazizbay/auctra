import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
}
registerEnumType(LikeGroup, { name: 'LikeGroup' });
