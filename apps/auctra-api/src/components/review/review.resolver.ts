import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Review, Reviews } from '../../libs/dto/review/review';
import { ReviewInput, ReviewsInquiry } from '../../libs/dto/review/review.input';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ReviewService } from './review.service';

@Resolver()
export class ReviewResolver {
	constructor(private readonly reviewService: ReviewService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Review)
	public async createReview(
		@Args('input') input: ReviewInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Review> {
		console.log('Mutation: createReview');
		input.orderId = shapeIntoMongoObjectId(input.orderId);
		return await this.reviewService.createReview(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Reviews)
	public async getReviews(
		@Args('input') input: ReviewsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Reviews> {
		console.log('Query: getReviews');
		input.search.sellerId = shapeIntoMongoObjectId(input.search.sellerId);
		return await this.reviewService.getReviews(memberId, input);
	}
}
