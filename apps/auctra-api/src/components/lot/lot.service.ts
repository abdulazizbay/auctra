import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lot, Lots } from '../../libs/dto/lot/lot';
import { LotInput, LotsInquiry } from '../../libs/dto/lot/lot.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { LotStatus, publicLotStatuses } from '../../libs/enums/lot.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class LotService {
	constructor(@InjectModel('Lot') private readonly lotModel: Model<Lot>) {}

	public async createLot(
		memberId: Types.ObjectId,
		input: LotInput,
	): Promise<Lot> {
		const now = new Date();
		const lotStartsAt = input.lotStartsAt ?? now;
		// clock chceck, give 1min
		if (
			lotStartsAt.getTime() < now.getTime() - 60_000 ||
			input.lotEndsAt <= lotStartsAt
		)
			throw new BadRequestException(Message.INVALID_LOT_TIME);
		if (
			input.lotCeilingPrice != null &&
			input.lotCeilingPrice <= input.lotStartPrice
		)
			throw new BadRequestException(Message.INVALID_CEILING_PRICE);

		try {
			return await this.lotModel.create({
				...input,
				memberId,
				lotStartsAt,
				lotCurrentPrice: input.lotStartPrice,
				lotStatus: lotStartsAt > now ? LotStatus.SCHEDULED : LotStatus.OPEN,
			});
		} catch (err) {
			console.log('Error, lot service: ', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getLot(
		memberId: Types.ObjectId | null,
		lotId: Types.ObjectId,
	): Promise<Lot> {
		const targetLot = await this.lotModel
			.findOne({ _id: lotId, lotStatus: { $in: publicLotStatuses } })
			.lean()
			.exec();
		if (!targetLot)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		// add view
		return targetLot;
	}

	public async getLots(
		memberId: Types.ObjectId | null,
		input: LotsInquiry,
	): Promise<Lots> {
		const {
			memberId: sellerId,
			lotStatus,
			lotCategoryList,
			lotConditionList,
			pricesRange,
			text,
		} = input.search;
		const match: T = { lotStatus: lotStatus ?? LotStatus.OPEN };
		if (sellerId) match.memberId = shapeIntoMongoObjectId(sellerId);
		if (lotCategoryList?.length) match.lotCategory = { $in: lotCategoryList };
		if (lotConditionList?.length)
			match.lotCondition = { $in: lotConditionList };
		if (pricesRange)
			match.lotCurrentPrice = {
				$gte: pricesRange.start,
				$lte: pricesRange.end,
			};
		if (text) match.lotName = { $regex: new RegExp(text, 'i') };

		const sort = {
			[input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
		};

		const result = await this.lotModel
			.aggregate([
				{ $match: match },
				{ $addFields: { lotPopular: { $add: ['$lotBids', '$lotWatchers'] } } },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							//check meWatched
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}
}
