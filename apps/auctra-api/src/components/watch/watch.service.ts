import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MeWatched, Watch } from '../../libs/dto/watch/watch';
import { Lots } from '../../libs/dto/lot/lot';
import { OrdinaryInquiry } from '../../libs/dto/lot/lot.input';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class WatchService {
	constructor(@InjectModel('Watch') private readonly watchModel: Model<Watch>) {}

	public async toggleWatch(memberId: Types.ObjectId, lotId: Types.ObjectId): Promise<number> {
		const search: T = { memberId: memberId, lotId: lotId };
		const exist = await this.watchModel.findOne(search).exec();
		let modifier = 1;
		if (exist) {
			await this.watchModel.findOneAndDelete(search).exec();
			modifier = -1;
		} else {
			try {
				await this.watchModel.create(search);
			} catch (err) {
				console.log('Error, Service.model', err);
				throw new BadRequestException(Message.CREATE_FAILED);
			}
		}
		return modifier;
	}

	public async getWatcherIds(lotId: Types.ObjectId): Promise<Types.ObjectId[]> {
		return await this.watchModel.distinct('memberId', { lotId: lotId }).exec();
	}

	public async checkWatchExistence(memberId: Types.ObjectId, lotId: Types.ObjectId): Promise<MeWatched[]> {
		const result = await this.watchModel.findOne({ memberId: memberId, lotId: lotId }).exec();
		return result ? [{ memberId: memberId, lotId: lotId, myWatch: true }] : [];
	}

	public async getWatchedLots(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Lots> {
		const { page, limit } = input;
		const match: T = { memberId: memberId };
		const data: T = await this.watchModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'lots',
						localField: 'lotId',
						foreignField: '_id',
						as: 'watchedLot',
					},
				},
				{ $unwind: '$watchedLot' },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		const result: Lots = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele: T) => ele.watchedLot);
		return result;
	}
}
