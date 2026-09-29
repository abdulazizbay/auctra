import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { Lots } from '../../libs/dto/lot/lot';
import { OrdinaryInquiry } from '../../libs/dto/lot/lot.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		if (viewExist) return null;
		try {
			return await this.viewModel.create(input);
		} catch (err) {
			return null;
		}
	}

	private async checkViewExistence(input: ViewInput): Promise<View | null> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId: memberId, viewRefId: viewRefId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedLots(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Lots> {
		const { page, limit } = input;
		const match: T = { viewGroup: ViewGroup.LOT, memberId: memberId };
		const data: T = await this.viewModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'lots',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedLot',
					},
				},
				{ $unwind: '$visitedLot' },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		const result: Lots = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele: T) => ele.visitedLot);
		return result;
	}
}
