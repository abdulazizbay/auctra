import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ArticleSchema from '../../schemas/Article.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';
import { LikeModule } from '../like/like.module';
import { FollowModule } from '../follow/follow.module';
import { NotificationModule } from '../notification/notification.module';
import { ArticleResolver } from './article.resolver';
import { ArticleService } from './article.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Article', schema: ArticleSchema }]),
		AuthModule,
		MemberModule,
		ViewModule,
		LikeModule,
		FollowModule,
		NotificationModule,
	],
	providers: [ArticleResolver, ArticleService],
	exports: [ArticleService],
})
export class ArticleModule {}
