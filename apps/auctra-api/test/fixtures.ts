import { Model, Types } from 'mongoose';
import { LotCategory, LotCondition } from '../src/libs/enums/lot.enum';

export async function makeLot(
	lotModel: Model<any>,
	overrides: Record<string, unknown> = {},
) {
	return lotModel.create({
		memberId: new Types.ObjectId(),
		lotName: 'Test Watch',
		lotImages: ['test.jpg'],
		lotCategory: LotCategory.WATCHES,
		lotCondition: LotCondition.USED,
		lotStartPrice: 100,
		lotCurrentPrice: 100,
		lotMinIncrement: 10,
		lotStartsAt: new Date(Date.now() - 60 * 60 * 1000),
		lotEndsAt: new Date(Date.now() + 60 * 60 * 1000),
		...overrides,
	});
}
