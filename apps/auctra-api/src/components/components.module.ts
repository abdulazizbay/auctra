import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { LotModule } from './lot/lot.module';

@Module({
	imports: [MemberModule, AuthModule, LotModule],
})
export class ComponentsModule {}
