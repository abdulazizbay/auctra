import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { Types } from 'mongoose';
import { NotificationRefType, NotificationType } from '../../enums/notification.enum';
import { NotificationPayload } from './notification';

export interface NotificationInput {
	memberId: Types.ObjectId;
	notificationType: NotificationType;
	notificationRefId: Types.ObjectId;
	notificationRefType: NotificationRefType;
	notificationPayload?: NotificationPayload;
}

@InputType()
class NISearch {
	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	unreadOnly?: boolean;
}

@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsNotEmpty()
	@Field(() => NISearch)
	search!: NISearch;
}
