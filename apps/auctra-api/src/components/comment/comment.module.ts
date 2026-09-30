import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CommentSchema from '../../schemas/Comment.model';
import { AuthModule } from '../auth/auth.module';
import { LotModule } from '../lot/lot.module';
import { ArticleModule } from '../article/article.module';
import { NotificationModule } from '../notification/notification.module';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Comment', schema: CommentSchema }]),
		AuthModule,
		LotModule,
		ArticleModule,
		NotificationModule,
	],
	providers: [CommentResolver, CommentService],
	exports: [CommentService],
})
export class CommentModule {}
