import { Controller, Get, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BatchService } from './batch.service';
import { BATCH_EXPIRE_ORDERS, BATCH_SWEEP_LOTS } from './lib/config';

@Controller()
export class BatchController implements OnApplicationBootstrap {
	private logger: Logger = new Logger('BatchController');
	constructor(private readonly batchService: BatchService) {}

	public async onApplicationBootstrap() {
		try {
			await this.batchService.scheduleLots();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('30 */5 * * * *', { name: BATCH_SWEEP_LOTS })
	public async batchSweepLots() {
		try {
			this.logger['context'] = BATCH_SWEEP_LOTS;
			this.logger.debug('EXECUTED');
			await this.batchService.batchOpenLots();
			await this.batchService.batchCloseLots();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('20 * * * * *', { name: BATCH_EXPIRE_ORDERS })
	public async batchExpireOrders() {
		try {
			this.logger['context'] = BATCH_EXPIRE_ORDERS;
			this.logger.debug('EXECUTED');
			await this.batchService.batchExpireOrders();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Get()
	getHello(): string {
		return this.batchService.getHello();
	}
}
