import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import LotSchema from '../../schemas/Lot.model';
import BidSchema from '../../schemas/Bid.model';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';
import { WatchModule } from '../watch/watch.module';
import { FollowModule } from '../follow/follow.module';
import { LotResolver } from './lot.resolver';
import { LotService } from './lot.service';
import { LOT_QUEUE } from '../../libs/config';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Lot', schema: LotSchema },
			{ name: 'Bid', schema: BidSchema },
		]),
		BullModule.registerQueue({ name: LOT_QUEUE }),
		AuthModule,
		MemberModule,
		ViewModule,
		WatchModule,
		FollowModule,
		NotificationModule,
		SocketModule,
	],
	providers: [LotResolver, LotService],
	exports: [LotService],
})
export class LotModule {}
