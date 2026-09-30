import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import FollowSchema from '../../schemas/Follow.model';
import { AuthModule } from '../auth/auth.module';
import { FollowResolver } from './follow.resolver';
import { FollowService } from './follow.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]), AuthModule],
	providers: [FollowResolver, FollowService],
	exports: [FollowService],
})
export class FollowModule {}
