import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import WatchSchema from '../../schemas/Watch.model';
import { WatchService } from './watch.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Watch', schema: WatchSchema }])],
	providers: [WatchService],
	exports: [WatchService],
})
export class WatchModule {}
