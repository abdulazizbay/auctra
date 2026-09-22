import { registerEnumType } from '@nestjs/graphql';

export enum CommentGroup {
	LOT = 'LOT',
	ARTICLE = 'ARTICLE',
}
registerEnumType(CommentGroup, { name: 'CommentGroup' });

export enum CommentStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
}
registerEnumType(CommentStatus, { name: 'CommentStatus' });
