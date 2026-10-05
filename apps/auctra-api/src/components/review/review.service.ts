import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Review, Reviews } from '../../libs/dto/review/review';
import {
	ReviewInput,
	ReviewsInquiry,
} from '../../libs/dto/review/review.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { lookupBuyerData } from '../../libs/config';
import { T } from '../../libs/types/common';
import { CacheGroup, CacheService } from '../../libs/cache/cache.service';
import { MemberService } from '../member/member.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class ReviewService {
	constructor(
		@InjectModel('Review') private readonly reviewModel: Model<Review>,
		@InjectConnection() private readonly connection: Connection,
		private readonly memberService: MemberService,
		private readonly orderService: OrderService,
		private readonly cacheService: CacheService,
	) {}

	public async createReview(
		memberId: Types.ObjectId,
		input: ReviewInput,
	): Promise<Review> {
		const order = await this.orderService.getOrder(memberId, input.orderId);
		if (
			order.buyerId.toString() !== memberId.toString() ||
			order.orderStatus !== OrderStatus.COMPLETED
		)
			throw new BadRequestException(Message.REVIEW_NOT_ALLOWED);

		const review = await this.connection.transaction(async (session) => {
			let result: Review | null = null;
			try {
				[result] = await this.reviewModel.create(
					[
						{
							orderId: order._id,
							buyerId: memberId,
							sellerId: order.sellerId,
							reviewRating: input.reviewRating,
							reviewText: input.reviewText,
						},
					],
					{ session },
				);
			} catch (err) {
				console.log('Error, Service.model:', err);
				throw new BadRequestException(Message.CREATE_FAILED);
			}

			await this.memberService.memberRatingEditor(order.sellerId, input.reviewRating, session);
			return result;
		});
		await this.cacheService.bump(CacheGroup.REVIEWS);
		await this.cacheService.bump(CacheGroup.SELLERS);
		return review;
	}

	public async getReviews(
		memberId: Types.ObjectId | null,
		input: ReviewsInquiry,
	): Promise<Reviews> {
		return await this.cacheService.wrap(CacheGroup.REVIEWS, input, () => this.findReviews(input));
	}

	private async findReviews(input: ReviewsInquiry): Promise<Reviews> {
		const { page, limit, search } = input;
		const match: T = { sellerId: search.sellerId };

		const result = await this.reviewModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupBuyerData,
							{ $unwind: '$buyerData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}
}
