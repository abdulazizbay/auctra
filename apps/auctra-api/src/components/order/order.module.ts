import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OrderSchema from '../../schemas/Order.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
		AuthModule,
		MemberModule,
	],
	providers: [OrderResolver, OrderService],
	exports: [OrderService],
})
export class OrderModule {}
