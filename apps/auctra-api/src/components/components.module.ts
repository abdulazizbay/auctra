import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { LotModule } from './lot/lot.module';
import { BidModule } from './bid/bid.module';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { FollowModule } from './follow/follow.module';
import { ArticleModule } from './article/article.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		LotModule,
		BidModule,
		OrderModule,
		ReviewModule,
		MessageModule,
		NotificationModule,
		FollowModule,
		ArticleModule,
	],
})
export class ComponentsModule {}
