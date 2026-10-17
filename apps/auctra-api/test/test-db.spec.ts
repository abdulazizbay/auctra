import { Types } from 'mongoose';
import { clearTestDb, startTestDb, stopTestDb } from './test-db';

describe('test database', () => {
	let db: Awaited<ReturnType<typeof startTestDb>>;

	beforeAll(async () => {
		db = await startTestDb();
	});
	afterEach(clearTestDb);
	afterAll(stopTestDb);

	it('saves and reads a document', async () => {
		const lotId = new Types.ObjectId();
		await db.bidModel.create({ lotId, memberId: new Types.ObjectId(), bidPrice: 100 });

		const found = await db.bidModel.findOne({ lotId });
		expect(found?.bidPrice).toBe(100);
	});

	it('starts empty again after clearTestDb', async () => {
		expect(await db.bidModel.countDocuments()).toBe(0);
	});
});
