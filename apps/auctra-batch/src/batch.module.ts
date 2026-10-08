import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { LotProcessor } from './lot.processor';
import { LOT_QUEUE, redisConnection } from 'apps/auctra-api/src/libs/config';
import { DatabaseModule } from './database/database.module';
import LotSchema from 'apps/auctra-api/src/schemas/Lot.model';
import OrderSchema from 'apps/auctra-api/src/schemas/Order.model';
import OrderItemSchema from 'apps/auctra-api/src/schemas/OrderItem.model';
import NotificationSchema from 'apps/auctra-api/src/schemas/Notification.model';
import BidSchema from 'apps/auctra-api/src/schemas/Bid.model';
import FollowSchema from 'apps/auctra-api/src/schemas/Follow.model';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		BullModule.forRoot({ connection: redisConnection() }),
		BullModule.registerQueue({ name: LOT_QUEUE }),
		MongooseModule.forFeature([{ name: 'Lot', schema: LotSchema }]),
		MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
		MongooseModule.forFeature([{ name: 'OrderItem', schema: OrderItemSchema }]),
		MongooseModule.forFeature([{ name: 'Notification', schema: NotificationSchema }]),
		MongooseModule.forFeature([{ name: 'Bid', schema: BidSchema }]),
		MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]),
	],
	controllers: [BatchController],
	providers: [BatchService, LotProcessor],
})
export class BatchModule {}
