import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lot } from '../../libs/dto/lot/lot';
import { LotInput } from '../../libs/dto/lot/lot.input';
import { Message } from '../../libs/enums/common.enum';
import { LotStatus } from '../../libs/enums/lot.enum';

@Injectable()
export class LotService {
	constructor(@InjectModel('Lot') private readonly lotModel: Model<Lot>) {}

	public async createLot(memberId: Types.ObjectId, input: LotInput): Promise<Lot> {
		const now = new Date();
		const lotStartsAt = input.lotStartsAt ?? now;
		// clock chceck, give 1min
		if (lotStartsAt.getTime() < now.getTime() - 60_000 || input.lotEndsAt <= lotStartsAt)
			throw new BadRequestException(Message.INVALID_LOT_TIME);
		if (input.lotCeilingPrice != null && input.lotCeilingPrice <= input.lotStartPrice)
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
}
