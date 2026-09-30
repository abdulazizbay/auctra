import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMaxSize, IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { Types } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/article.enum';
import { Direction } from '../../enums/common.enum';
import { availableArticleSorts } from '../../config';

@InputType()
export class ArticleInput {
	@IsNotEmpty()
	@Field(() => ArticleCategory)
	articleCategory!: ArticleCategory;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	articleTitle!: string;

	@IsNotEmpty()
	@Length(3, 5000)
	@Field(() => String)
	articleContent!: string;

	@IsOptional()
	@ArrayMaxSize(10)
	@Field(() => [String], { nullable: true })
	articleImages?: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	lotId?: Types.ObjectId;
}

@InputType()
class AISearch {
	@IsOptional()
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: Types.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	lotId?: Types.ObjectId;
}

@InputType()
export class ArticlesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AISearch)
	search!: AISearch;
}

@InputType()
class AAISearch {
	@IsOptional()
	@Field(() => ArticleStatus, { nullable: true })
	articleStatus?: ArticleStatus;

	@IsOptional()
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;
}

@InputType()
export class AllArticlesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AAISearch)
	search!: AAISearch;
}
