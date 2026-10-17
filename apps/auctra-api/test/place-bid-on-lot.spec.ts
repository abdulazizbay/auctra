import { Types } from 'mongoose';
import { LotService } from '../src/components/lot/lot.service';
import { clearTestDb, startTestDb, stopTestDb } from './test-db';
import { makeLot } from './fixtures';

describe('LotService.placeBidOnLot', () => {
	let db: Awaited<ReturnType<typeof startTestDb>>;
	let lotService: LotService;

	beforeAll(async () => {
		db = await startTestDb();
		const unused = null as any;
		lotService = new LotService(db.lotModel, db.bidModel, unused, unused, unused, unused, unused, unused, unused);
	});
	afterEach(clearTestDb);
	afterAll(stopTestDb);

	it('accepts a valid first bid', async () => {
		const lot = await makeLot(db.lotModel);
		const bidder = new Types.ObjectId();

		const previous = await lotService.placeBidOnLot(bidder, lot._id, 100);

		expect(previous).not.toBeNull();
		const updated = await db.lotModel.findById(lot._id);
		expect(updated.lotCurrentPrice).toBe(100);
		expect(updated.lotHighestBidderId.toString()).toBe(bidder.toString());
		expect(updated.lotBids).toBe(1);
	});
});
