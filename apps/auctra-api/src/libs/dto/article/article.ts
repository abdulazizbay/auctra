import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/article.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Article {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => ArticleCategory)
	articleCategory!: ArticleCategory;

	@Field(() => ArticleStatus)
	articleStatus!: ArticleStatus;

	@Field(() => String)
	articleTitle!: string;

	@Field(() => String)
	articleContent!: string;

	@Field(() => [String])
	articleImages!: string[];

	@Field(() => String, { nullable: true })
	lotId?: Types.ObjectId;

	@Field(() => Int)
	articleViews!: number;

	@Field(() => Int)
	articleLikes!: number;

	@Field(() => Int)
	articleComments!: number;

	@Field(() => String)
	memberId!: Types.ObjectId;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Articles {
	@Field(() => [Article])
	list!: Article[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
