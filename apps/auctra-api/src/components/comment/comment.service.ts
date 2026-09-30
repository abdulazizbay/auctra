import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { Lot } from '../../libs/dto/lot/lot';
import { Article } from '../../libs/dto/article/article';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NotificationRefType, NotificationType } from '../../libs/enums/notification.enum';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { LotService } from '../lot/lot.service';
import { ArticleService } from '../article/article.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private readonly lotService: LotService,
		private readonly articleService: ArticleService,
		private readonly notificationService: NotificationService,
	) {}

	public async createComment(memberId: Types.ObjectId, input: CommentInput): Promise<Comment> {
		const target = await this.commentStatsEditor(input.commentGroup, input.commentRefId, 1);
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		let result: Comment;
		try {
			result = await this.commentModel.create({ ...input, memberId: memberId });
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		if (target.memberId.toString() !== memberId.toString()) {
			await this.notificationService.createNotification({
				memberId: target.memberId,
				notificationType: NotificationType.NEW_COMMENT,
				notificationRefId: input.commentRefId,
				notificationRefType:
					input.commentGroup === CommentGroup.LOT ? NotificationRefType.LOT : NotificationRefType.ARTICLE,
				notificationPayload: {
					lotName: 'lotName' in target ? target.lotName : undefined,
					text: input.commentText.slice(0, 100),
				},
			});
		}
		return result;
	}

	public async updateComment(memberId: Types.ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id, ...update } = input;
		const result = await this.commentModel
			.findOneAndUpdate({ _id: _id, memberId: memberId, commentStatus: CommentStatus.ACTIVE }, update, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (result.commentStatus === CommentStatus.DELETED)
			await this.commentStatsEditor(result.commentGroup, result.commentRefId, -1);
		return result;
	}

	public async getComments(memberId: Types.ObjectId | null, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;
		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.commentModel
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

	public async removeCommentByAdmin(commentId: Types.ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(commentId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		if (result.commentStatus === CommentStatus.ACTIVE)
			await this.commentStatsEditor(result.commentGroup, result.commentRefId, -1);
		return result;
	}

	private async commentStatsEditor(
		commentGroup: CommentGroup,
		commentRefId: Types.ObjectId,
		modifier: number,
	): Promise<Lot | Article | null> {
		if (commentGroup === CommentGroup.LOT)
			return await this.lotService.lotStatsEditor({
				_id: commentRefId,
				targetKey: 'lotComments',
				modifier: modifier,
			});
		return await this.articleService.articleStatsEditor({
			_id: commentRefId,
			targetKey: 'articleComments',
			modifier: modifier,
		});
	}
}
