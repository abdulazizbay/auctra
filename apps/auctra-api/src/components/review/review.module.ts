import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ReviewSchema from '../../schemas/Review.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { OrderModule } from '../order/order.module';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Review', schema: ReviewSchema }]),
		AuthModule,
		MemberModule,
		OrderModule,
	],
	providers: [ReviewResolver, ReviewService],
	exports: [ReviewService],
})
export class ReviewModule {}
