import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BidService } from '../src/components/bid/bid.service';
import { LotService } from '../src/components/lot/lot.service';
import { clearTestDb, startTestDb, stopTestDb } from './test-db';
import { makeLot } from './fixtures';

describe('BidService.placeBid under concurrent bids', () => {
	let db: Awaited<ReturnType<typeof startTestDb>>;
	let bidService: BidService;
	let socketGateway: { emitToRoom: jest.Mock };

	beforeAll(async () => {
		db = await startTestDb();
		const unused = null as any;
		const lotService = new LotService(db.lotModel, db.bidModel, unused, unused, unused, unused, unused, unused, unused);
		const notificationService = {
			createNotification: jest.fn(async () => ({})),
			pushNotification: jest.fn(),
		};
		socketGateway = { emitToRoom: jest.fn() };
		bidService = new BidService(
			db.bidModel,
			db.connection,
			lotService,
			notificationService as any,
			socketGateway as any,
		);
	});
	afterEach(async () => {
		await clearTestDb();
		socketGateway.emitToRoom.mockClear();
	});
	afterAll(stopTestDb);

	it.each([1, 2, 3])('keeps the lot consistent when 10 members bid at once (round %i)', async () => {
		const lot = await makeLot(db.lotModel, { lotCurrentPrice: 100, lotMinIncrement: 10 });
		const members = Array.from({ length: 10 }, (_, i) => ({
			_id: new Types.ObjectId(),
			memberNick: `bidder${i}`,
			memberImage: '',
		}));
		const prices = [130, 100, 170, 110, 190, 150, 120, 180, 140, 160];

		const results = await Promise.allSettled(
			members.map((member, i) =>
				bidService.placeBid(member as any, { lotId: lot._id, bidPrice: prices[i] } as any),
			),
		);

		const accepted = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
		const rejected = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
		const finalLot = await db.lotModel.findById(lot._id);
		const savedBids = await db.bidModel.find({ lotId: lot._id }).sort({ bidPrice: 1 });

		expect(accepted.length).toBeGreaterThan(0);
		rejected.forEach((err) => expect(err).toBeInstanceOf(BadRequestException));

		expect(savedBids.length).toBe(accepted.length);
		expect(finalLot.lotBids).toBe(accepted.length);

		const highest = savedBids[savedBids.length - 1];
		expect(finalLot.lotCurrentPrice).toBe(highest.bidPrice);
		expect(finalLot.lotHighestBidderId.toString()).toBe(highest.memberId.toString());

		for (let i = 1; i < savedBids.length; i++) {
			expect(savedBids[i].bidPrice).toBeGreaterThanOrEqual(savedBids[i - 1].bidPrice + 10);
		}

		expect(socketGateway.emitToRoom).toHaveBeenCalledTimes(accepted.length);
	});
});
