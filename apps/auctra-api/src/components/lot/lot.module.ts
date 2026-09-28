import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import LotSchema from '../../schemas/Lot.model';
import { AuthModule } from '../auth/auth.module';
import { LotResolver } from './lot.resolver';
import { LotService } from './lot.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Lot', schema: LotSchema }]), AuthModule],
	providers: [LotResolver, LotService],
	exports: [LotService],
})
export class LotModule {}
