import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { T } from '../../libs/types/common';
import { CacheGroup, CacheService } from '../../libs/cache/cache.service';

@Injectable()
export class NoticeService {
	constructor(
		@InjectModel('Notice') private readonly noticeModel: Model<Notice>,
		private readonly cacheService: CacheService,
	) {}

	public async createNotice(input: NoticeInput): Promise<Notice> {
		let result: Notice;
		try {
			result = await this.noticeModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
		await this.cacheService.bump(CacheGroup.NOTICES);
		return result;
	}

	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		return await this.cacheService.wrap(CacheGroup.NOTICES, input, () => this.findNotices(input));
	}

	private async findNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeType } = input.search;
		const match: T = { noticeStatus: NoticeStatus.ACTIVE };
		if (noticeType) match.noticeType = noticeType;

		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: { noticeOrder: Direction.ASC, createdAt: Direction.DESC } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<Notices> {
		const { noticeType, noticeStatus } = input.search;
		const match: T = {};
		if (noticeType) match.noticeType = noticeType;
		if (noticeStatus) match.noticeStatus = noticeStatus;

		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: { noticeOrder: Direction.ASC, createdAt: Direction.DESC } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
		const { _id, ...update } = input;
		const result = await this.noticeModel.findOneAndUpdate({ _id: _id }, update, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		await this.cacheService.bump(CacheGroup.NOTICES);
		return result;
	}

	public async removeNoticeByAdmin(noticeId: Types.ObjectId): Promise<Notice> {
		const result = await this.noticeModel.findByIdAndDelete(noticeId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		await this.cacheService.bump(CacheGroup.NOTICES);
		return result;
	}
}
