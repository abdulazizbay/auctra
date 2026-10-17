import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import LotSchema from '../src/schemas/Lot.model';
import BidSchema from '../src/schemas/Bid.model';

let replSet: MongoMemoryReplSet;

export async function startTestDb() {
	replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
	await mongoose.connect(replSet.getUri());

	const lotModel = mongoose.models.Lot ?? mongoose.model('Lot', LotSchema);
	const bidModel = mongoose.models.Bid ?? mongoose.model('Bid', BidSchema);

	await lotModel.init();
	await bidModel.init();

	return { connection: mongoose.connection, lotModel, bidModel };
}

export async function clearTestDb() {
	const collections = mongoose.connection.collections;
	for (const name in collections) await collections[name].deleteMany({});
}

export async function stopTestDb() {
	await mongoose.disconnect();
	await replSet.stop();
}
