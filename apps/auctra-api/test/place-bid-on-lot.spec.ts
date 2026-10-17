import { Types } from 'mongoose';
import { LotService } from '../src/components/lot/lot.service';
import { LotStatus } from '../src/libs/enums/lot.enum';
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

	it('rejects a first bid below the current price', async () => {
		const lot = await makeLot(db.lotModel);

		const previous = await lotService.placeBidOnLot(new Types.ObjectId(), lot._id, 95);

		expect(previous).toBeNull();
		const unchanged = await db.lotModel.findById(lot._id);
		expect(unchanged.lotCurrentPrice).toBe(100);
		expect(unchanged.lotBids).toBe(0);
	});

	it('requires the minimum increment after the first bid', async () => {
		const lot = await makeLot(db.lotModel, { lotBids: 1, lotHighestBidderId: new Types.ObjectId() });

		expect(await lotService.placeBidOnLot(new Types.ObjectId(), lot._id, 105)).toBeNull();
		expect(await lotService.placeBidOnLot(new Types.ObjectId(), lot._id, 110)).not.toBeNull();

		const updated = await db.lotModel.findById(lot._id);
		expect(updated.lotCurrentPrice).toBe(110);
		expect(updated.lotBids).toBe(2);
	});

	it('rejects the seller bidding on their own lot', async () => {
		const seller = new Types.ObjectId();
		const lot = await makeLot(db.lotModel, { memberId: seller });

		expect(await lotService.placeBidOnLot(seller, lot._id, 100)).toBeNull();
	});

	it('rejects the highest bidder outbidding themselves', async () => {
		const bidder = new Types.ObjectId();
		const lot = await makeLot(db.lotModel);

		expect(await lotService.placeBidOnLot(bidder, lot._id, 100)).not.toBeNull();
		expect(await lotService.placeBidOnLot(bidder, lot._id, 150)).toBeNull();
	});

	it('rejects bids on an ended lot', async () => {
		const lot = await makeLot(db.lotModel, { lotEndsAt: new Date(Date.now() - 1000) });

		expect(await lotService.placeBidOnLot(new Types.ObjectId(), lot._id, 100)).toBeNull();
	});

	it('rejects bids on a lot that is not open', async () => {
		const lot = await makeLot(db.lotModel, { lotStatus: LotStatus.SCHEDULED });

		expect(await lotService.placeBidOnLot(new Types.ObjectId(), lot._id, 100)).toBeNull();
	});

	it('caps the price at the ceiling and ends the lot', async () => {
		const lot = await makeLot(db.lotModel, { lotCeilingPrice: 150 });

		expect(await lotService.placeBidOnLot(new Types.ObjectId(), lot._id, 200)).not.toBeNull();

		const updated = await db.lotModel.findById(lot._id);
		expect(updated.lotCurrentPrice).toBe(150);
		expect(updated.lotEndsAt.getTime()).toBeLessThanOrEqual(Date.now());
	});
});
