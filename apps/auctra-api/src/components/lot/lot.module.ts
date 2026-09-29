import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import LotSchema from '../../schemas/Lot.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { WatchModule } from '../watch/watch.module';
import { LotResolver } from './lot.resolver';
import { LotService } from './lot.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Lot', schema: LotSchema }]),
		AuthModule,
		ViewModule,
		WatchModule,
	],
	providers: [LotResolver, LotService],
	exports: [LotService],
})
export class LotModule {}
