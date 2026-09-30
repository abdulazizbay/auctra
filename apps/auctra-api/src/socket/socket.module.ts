import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OrderSchema from '../schemas/Order.model';
import { AuthModule } from '../components/auth/auth.module';
import { SocketGateway } from './socket.gateway';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]), AuthModule],
	providers: [SocketGateway],
	exports: [SocketGateway],
})
export class SocketModule {}
