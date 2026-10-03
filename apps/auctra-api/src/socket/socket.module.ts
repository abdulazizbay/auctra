import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OrderSchema from '../schemas/Order.model';
import { AuthModule } from '../components/auth/auth.module';
import { SocketGateway } from './socket.gateway';
import { SocketController } from './socket.controller';
// only for batch
@Module({
	imports: [MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]), AuthModule],
	controllers: [SocketController],
	providers: [SocketGateway],
	exports: [SocketGateway],
})
export class SocketModule {}
