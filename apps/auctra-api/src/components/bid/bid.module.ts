import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BidSchema from '../../schemas/Bid.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { LotModule } from '../lot/lot.module';
import { BidResolver } from './bid.resolver';
import { BidService } from './bid.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Bid', schema: BidSchema }]),
		AuthModule,
		NotificationModule,
		LotModule,
	],
	providers: [BidResolver, BidService],
	exports: [BidService],
})
export class BidModule {}
