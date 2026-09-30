import { Field, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { Types } from 'mongoose';
import { ArticleStatus } from '../../enums/article.enum';

@InputType()
export class ArticleUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: Types.ObjectId;

	@IsOptional()
	@Field(() => ArticleStatus, { nullable: true })
	articleStatus?: ArticleStatus;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@IsOptional()
	@Length(3, 5000)
	@Field(() => String, { nullable: true })
	articleContent?: string;

	@IsOptional()
	@ArrayMaxSize(10)
	@Field(() => [String], { nullable: true })
	articleImages?: string[];
}
