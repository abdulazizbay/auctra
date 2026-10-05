import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LOT_QUEUE, LotJob, shapeIntoMongoObjectId } from 'apps/auctra-api/src/libs/config';
import { BatchService } from './batch.service';

@Processor(LOT_QUEUE)
export class LotProcessor extends WorkerHost {
	constructor(private readonly batchService: BatchService) {
		super();
	}

	public async process(job: Job<{ lotId: string }>): Promise<void> {
		const lotId = shapeIntoMongoObjectId(job.data.lotId);
		if (job.name === LotJob.OPEN) await this.batchService.openLot(lotId);
		if (job.name === LotJob.CLOSE) await this.batchService.closeLot(lotId);
	}
}
