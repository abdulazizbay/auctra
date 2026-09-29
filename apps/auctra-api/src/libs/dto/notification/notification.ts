import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { NotificationRefType, NotificationType } from '../../enums/notification.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class NotificationPayload {
	@Field(() => String, { nullable: true })
	lotName?: string;

	@Field(() => Int, { nullable: true })
	price?: number;

	@Field(() => String, { nullable: true })
	text?: string;
}

@ObjectType()
export class Notification {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	memberId!: Types.ObjectId;

	@Field(() => NotificationType)
	notificationType!: NotificationType;

	@Field(() => String)
	notificationRefId!: Types.ObjectId;

	@Field(() => NotificationRefType)
	notificationRefType!: NotificationRefType;

	@Field(() => NotificationPayload, { nullable: true })
	notificationPayload?: NotificationPayload;

	@Field(() => Date, { nullable: true })
	notificationReadAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class Notifications {
	@Field(() => [Notification])
	list!: Notification[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
