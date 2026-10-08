import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Bid, Bids } from '../../libs/dto/bid/bid';
import { BidInput, BidsInquiry } from '../../libs/dto/bid/bid.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { NotificationRefType, NotificationType } from '../../libs/enums/notification.enum';
import { Notification } from '../../libs/dto/notification/notification';
import { Member } from '../../libs/dto/member/member';
import { LotService } from '../lot/lot.service';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class BidService {
	constructor(
		@InjectModel('Bid') private readonly bidModel: Model<Bid>,
		@InjectConnection() private readonly connection: Connection,
		private readonly lotService: LotService,
		private readonly notificationService: NotificationService,
		private readonly socketGateway: SocketGateway,
	) {}

	public async placeBid(authMember: Member, input: BidInput): Promise<Bid> {
		const memberId = authMember._id;
		const { result, previousLot, outbid } = await this.connection.transaction(async (session) => {
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

			let outbid: Notification | null = null;
			if (previousLot.lotHighestBidderId) {
				outbid = await this.notificationService.createNotification(
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
			return { result, previousLot, outbid };
		});

		this.socketGateway.emitToRoom(`lot:${previousLot._id}`, {
			event: 'bid',
			lotId: previousLot._id,
			bidPrice: result.bidPrice,
			memberId: memberId,
			lotBids: previousLot.lotBids + 1,
			lotEndsAt: result.bidPrice === previousLot.lotCeilingPrice ? result.createdAt : previousLot.lotEndsAt,
			bid: {
				_id: result._id,
				lotId: result.lotId,
				memberId: memberId,
				bidPrice: result.bidPrice,
				createdAt: result.createdAt,
				memberData: { _id: memberId, memberNick: authMember.memberNick, memberImage: authMember.memberImage },
			},
		});
		if (outbid) this.notificationService.pushNotification(outbid);
		if (result.bidPrice === previousLot.lotCeilingPrice) await this.lotService.closeLotNow(previousLot._id);
		return result;
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
