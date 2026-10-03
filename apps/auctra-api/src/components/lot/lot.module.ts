import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import LotSchema from '../../schemas/Lot.model';
import BidSchema from '../../schemas/Bid.model';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';
import { WatchModule } from '../watch/watch.module';
import { LotResolver } from './lot.resolver';
import { LotService } from './lot.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Lot', schema: LotSchema },
			{ name: 'Bid', schema: BidSchema },
		]),
		AuthModule,
		MemberModule,
		ViewModule,
		WatchModule,
		NotificationModule,
		SocketModule,
	],
	providers: [LotResolver, LotService],
	exports: [LotService],
})
export class LotModule {}
