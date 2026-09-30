import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MessageSchema from '../../schemas/Message.model';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../../socket/socket.module';
import { NotificationModule } from '../notification/notification.module';
import { OrderModule } from '../order/order.module';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
		AuthModule,
		SocketModule,
		NotificationModule,
		OrderModule,
	],
	providers: [MessageResolver, MessageService],
	exports: [MessageService],
})
export class MessageModule {}
