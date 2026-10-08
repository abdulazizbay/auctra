import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { Model, PipelineStage, Types } from 'mongoose';
import { redisConnection } from '../config';
import { T } from '../types/common';

export enum CacheGroup {
	NOTICES = 'notices',
	SELLERS = 'sellers',
	ARTICLES = 'articles',
	REVIEWS = 'reviews',
}

const CACHE_TTL: Record<CacheGroup, number> = {
	[CacheGroup.NOTICES]: 60 * 60 * 1000,
	[CacheGroup.SELLERS]: 5 * 60 * 1000,
	[CacheGroup.ARTICLES]: 60 * 1000,
	[CacheGroup.REVIEWS]: 10 * 60 * 1000,
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

@Injectable()
export class CacheService {
	private logger = new Logger('CacheService');
	private redis = new Redis({ ...redisConnection(), enableOfflineQueue: false });

	public async wrap<R>(group: CacheGroup, input: T, fetch: () => Promise<R>): Promise<R> {
		const start = Date.now();
		let key: string | null = null;
		try {
			const version = (await this.redis.get(`cache:${group}:v`)) ?? '0';
			const hash = createHash('md5').update(JSON.stringify(input)).digest('hex');
			key = `cache:${group}:v${version}:${hash}`;
			const cached = await this.redis.get(key);
			if (cached) {
				this.logger.verbose(`HIT ${group} ${Date.now() - start}ms`);
				return JSON.parse(cached, (_, value) => (typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value));
			}
		} catch (err) {
			key = null;
		}

		const result = await fetch();
		if (key) this.redis.set(key, JSON.stringify(result), 'PX', CACHE_TTL[group]).catch(() => null);
		this.logger.verbose(`MISS ${group} ${Date.now() - start}ms`);
		return result;
	}

	public async bump(group: CacheGroup): Promise<void> {
		try {
			await this.redis.incr(`cache:${group}:v`);
		} catch (err) {
			this.logger.error(`bump ${group} failed`);
		}
	}

	public async attachMe<R extends { list: T[] }>(result: R, model: Model<any>, stages: PipelineStage[]): Promise<R> {
		if (!result?.list?.length) return result;
		const ids = result.list.map((item) => new Types.ObjectId(String(item._id)));
		const rows = await model.aggregate([{ $match: { _id: { $in: ids } } }, ...stages]).exec();
		const meById = new Map(rows.map(({ _id, ...me }) => [String(_id), me]));
		result.list.forEach((item) => Object.assign(item, meById.get(String(item._id))));
		return result;
	}
}
