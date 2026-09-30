import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article, Articles } from '../../libs/dto/article/article';
import {
	AllArticlesInquiry,
	ArticleInput,
	ArticlesInquiry,
} from '../../libs/dto/article/article.input';
import { ArticleUpdate } from '../../libs/dto/article/article.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ArticleStatus } from '../../libs/enums/article.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { StatisticModifier, T } from '../../libs/types/common';
import {
	lookAuthMemberLiked,
	lookupMember,
	shapeIntoMongoObjectId,
} from '../../libs/config';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';

@Injectable()
export class ArticleService {
	constructor(
		@InjectModel('Article') private readonly articleModel: Model<Article>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
	) {}
	public async createArticle(
		memberId: Types.ObjectId,
		input: ArticleInput,
	): Promise<Article> {
		try {
			return await this.articleModel.create({ ...input, memberId: memberId });
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getArticle(
		memberId: Types.ObjectId | null,
		articleId: Types.ObjectId,
	): Promise<Article> {
		const search: T = { _id: articleId, articleStatus: ArticleStatus.ACTIVE };
		const targetArticle = await this.articleModel.findOne(search).lean().exec();
		if (!targetArticle)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			if (memberId.toString() !== targetArticle.memberId.toString()) {
				const newView = await this.viewService.recordView({
					memberId: memberId,
					viewRefId: articleId,
					viewGroup: ViewGroup.ARTICLE,
				});
				if (newView) {
					await this.articleStatsEditor({
						_id: articleId,
						targetKey: 'articleViews',
						modifier: 1,
					});
					targetArticle.articleViews++;
				}
			}
			targetArticle.meLiked = await this.likeService.checkLikeExistence({
				memberId: memberId,
				likeRefId: articleId,
				likeGroup: LikeGroup.ARTICLE,
			});
		}

		targetArticle.memberData = await this.memberService.getMember(
			null,
			targetArticle.memberId,
		);
		return targetArticle;
	}

	public async updateArticle(
		memberId: Types.ObjectId,
		input: ArticleUpdate,
	): Promise<Article> {
		const { _id, ...update } = input;
		const result = await this.articleModel
			.findOneAndUpdate(
				{ _id: _id, memberId: memberId, articleStatus: ArticleStatus.ACTIVE },
				update,
				{
					new: true,
				},
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getArticles(
		memberId: Types.ObjectId | null,
		input: ArticlesInquiry,
	): Promise<Articles> {
		const { articleCategory, text, memberId: authorId, lotId } = input.search;
		const match: T = { articleStatus: ArticleStatus.ACTIVE };
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};

		if (articleCategory) match.articleCategory = articleCategory;
		if (text) match.articleTitle = { $regex: new RegExp(text, 'i') };
		if (authorId) match.memberId = shapeIntoMongoObjectId(authorId);
		if (lotId) match.lotId = shapeIntoMongoObjectId(lotId);

		const result = await this.articleModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async likeTargetArticle(
		memberId: Types.ObjectId,
		likeRefId: Types.ObjectId,
	): Promise<Article> {
		const target = await this.articleModel
			.findOne({ _id: likeRefId, articleStatus: ArticleStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (target.memberId.toString() === memberId.toString())
			throw new BadRequestException(Message.SELF_LIKE_DENIED);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.ARTICLE,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.articleStatsEditor({
			_id: likeRefId,
			targetKey: 'articleLikes',
			modifier: modifier,
		});
		if (!result)
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllArticlesByAdmin(
		input: AllArticlesInquiry,
	): Promise<Articles> {
		const { articleStatus, articleCategory } = input.search;
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};

		if (articleStatus) match.articleStatus = articleStatus;
		if (articleCategory) match.articleCategory = articleCategory;

		const result = await this.articleModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async updateArticleByAdmin(input: ArticleUpdate): Promise<Article> {
		const { _id, ...update } = input;
		const result = await this.articleModel
			.findOneAndUpdate(
				{ _id: _id },
				update,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeArticleByAdmin(
		articleId: Types.ObjectId,
	): Promise<Article> {
		const search: T = { _id: articleId, articleStatus: ArticleStatus.DELETED };
		const result = await this.articleModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	public async articleStatsEditor(
		input: StatisticModifier,
	): Promise<Article | null> {
		const { _id, targetKey, modifier } = input;
		return await this.articleModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{ new: true },
			)
			.exec();
	}
}
