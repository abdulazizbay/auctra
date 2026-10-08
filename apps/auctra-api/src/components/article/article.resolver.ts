import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Article, Articles } from '../../libs/dto/article/article';
import {
	AllArticlesInquiry,
	ArticleInput,
	ArticlesInquiry,
} from '../../libs/dto/article/article.input';
import { ArticleUpdate } from '../../libs/dto/article/article.update';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ArticleService } from './article.service';
import { Throttle, minutes } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '../auth/guards/gql-throttler.guard';

@Resolver()
export class ArticleResolver {
	constructor(private readonly articleService: ArticleService) {}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 5, ttl: minutes(1) } })
	@Mutation(() => Article)
	public async createArticle(
		@Args('input') input: ArticleInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Article> {
		console.log('Mutation: createArticle');
		if (input.lotId) input.lotId = shapeIntoMongoObjectId(input.lotId);
		return await this.articleService.createArticle(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Article)
	public async getArticle(
		@Args('articleId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Article> {
		console.log('Query: getArticle');
		const articleId = shapeIntoMongoObjectId(input);
		return await this.articleService.getArticle(memberId, articleId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Article)
	public async updateArticle(
		@Args('input') input: ArticleUpdate,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Article> {
		console.log('Mutation: updateArticle');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.articleService.updateArticle(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Articles)
	public async getArticles(
		@Args('input') input: ArticlesInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Articles> {
		console.log('Query: getArticles');
		return await this.articleService.getArticles(memberId, input);
	}

	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Throttle({ default: { limit: 30, ttl: minutes(1) } })
	@Mutation(() => Article)
	public async likeTargetArticle(
		@Args('articleId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Article> {
		console.log('Mutation: likeTargetArticle');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.articleService.likeTargetArticle(memberId, likeRefId);
	}

	// Admin

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Articles)
	public async getAllArticlesByAdmin(
		@Args('input') input: AllArticlesInquiry,
	): Promise<Articles> {
		console.log('Query: getAllArticlesByAdmin');
		return await this.articleService.getAllArticlesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Article)
	public async updateArticleByAdmin(
		@Args('input') input: ArticleUpdate,
	): Promise<Article> {
		console.log('Mutation: updateArticleByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.articleService.updateArticleByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Article)
	public async removeArticleByAdmin(
		@Args('articleId') input: string,
	): Promise<Article> {
		console.log('Mutation: removeArticleByAdmin');
		const articleId = shapeIntoMongoObjectId(input);
		return await this.articleService.removeArticleByAdmin(articleId);
	}
}
