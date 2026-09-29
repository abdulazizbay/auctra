import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Bid, Bids } from '../../libs/dto/bid/bid';
import { BidInput, BidsInquiry } from '../../libs/dto/bid/bid.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { NotificationRefType, NotificationType } from '../../libs/enums/notification.enum';
import { LotService } from '../lot/lot.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BidService {
	constructor(
		@InjectModel('Bid') private readonly bidModel: Model<Bid>,
		@InjectConnection() private readonly connection: Connection,
		private readonly lotService: LotService,
		private readonly notificationService: NotificationService,
	) {}

	public async placeBid(memberId: Types.ObjectId, input: BidInput): Promise<Bid> {
		return await this.connection.transaction(async (session) => {
			const previousLot = await this.lotService.placeBidOnLot(memberId, input.lotId, input.bidPrice, session);
			if (!previousLot) throw new BadRequestException(Message.BID_NOT_ACCEPTED);
			const bidPrice = Math.min(input.bidPrice, previousLot.lotCeilingPrice ?? input.bidPrice);

			let result: Bid;
			try {
				[result] = await this.bidModel.create(
					[{ lotId: previousLot._id, memberId: memberId, bidPrice: bidPrice }],
					{ session },
				);
			} catch (err) {
				console.log('Error, Service.model:', err);
				throw new BadRequestException(Message.CREATE_FAILED);
			}

			if (previousLot.lotHighestBidderId) {
				await this.notificationService.createNotification(
					{
						memberId: previousLot.lotHighestBidderId,
						notificationType: NotificationType.OUTBID,
						notificationRefId: previousLot._id,
						notificationRefType: NotificationRefType.LOT,
						notificationPayload: { lotName: previousLot.lotName, price: bidPrice },
					},
					session,
				);
			}
			return result;
		});
	}

	public async getBids(memberId: Types.ObjectId | null, input: BidsInquiry): Promise<Bids> {
		const { page, limit, search } = input;
		const match: T = { lotId: search.lotId };

		const result = await this.bidModel
			.aggregate([
				{ $match: match },
				{ $sort: { bidPrice: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}
}
