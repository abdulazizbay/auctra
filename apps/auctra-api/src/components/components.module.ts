import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { LotModule } from './lot/lot.module';
import { BidModule } from './bid/bid.module';
import { OrderModule } from './order/order.module';

@Module({
	imports: [MemberModule, AuthModule, LotModule, BidModule, OrderModule],
})
export class ComponentsModule {}
