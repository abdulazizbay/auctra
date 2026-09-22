import { registerEnumType } from '@nestjs/graphql';

export enum ArticleCategory {
	AUTHENTICATION = 'AUTHENTICATION',
	MARKET_TALK = 'MARKET_TALK',
	SHOWCASE = 'SHOWCASE',
	NEWS = 'NEWS',
}
registerEnumType(ArticleCategory, { name: 'ArticleCategory' });

export enum ArticleStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
}
registerEnumType(ArticleStatus, { name: 'ArticleStatus' });
