import { Controller, Get, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BatchService } from './batch.service';
import { BATCH_CLOSE_LOTS, BATCH_EXPIRE_ORDERS, BATCH_OPEN_LOTS } from './lib/config';

@Controller()
export class BatchController {
	private logger: Logger = new Logger('BatchController');
	constructor(private readonly batchService: BatchService) {}

	@Cron('00 * * * * *', { name: BATCH_OPEN_LOTS })
	public async batchOpenLots() {
		try {
			this.logger['context'] = BATCH_OPEN_LOTS;
			this.logger.debug('EXECUTED');
			await this.batchService.batchOpenLots();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('*/10 * * * * *', { name: BATCH_CLOSE_LOTS })
	public async batchCloseLots() {
		try {
			this.logger['context'] = BATCH_CLOSE_LOTS;
			this.logger.debug('EXECUTED');
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
