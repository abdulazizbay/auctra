import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationInput, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class NotificationService {
	constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

	public async createNotification(input: NotificationInput, session?: ClientSession): Promise<Notification> {
		try {
			const [result] = await this.notificationModel.create([input], { session });
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getNotifications(memberId: Types.ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const { page, limit, search } = input;
		const match: T = { memberId: memberId };
		if (search.unreadOnly) match.notificationReadAt = null;

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async readNotification(memberId: Types.ObjectId, notificationId: Types.ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndUpdate(
				{ _id: notificationId, memberId: memberId },
				{ notificationReadAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async readAllNotifications(memberId: Types.ObjectId): Promise<number> {
		const result = await this.notificationModel
			.updateMany({ memberId: memberId, notificationReadAt: null }, { notificationReadAt: new Date() })
			.exec();
		return result.modifiedCount;
	}
}
