import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { NoticeStatus, NoticeType } from '../../enums/notice.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Notice {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	noticeTitle!: string;

	@Field(() => String)
	noticeContent!: string;

	@Field(() => NoticeType)
	noticeType!: NoticeType;

	@Field(() => NoticeStatus)
	noticeStatus!: NoticeStatus;

	@Field(() => Int)
	noticeOrder!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class Notices {
	@Field(() => [Notice])
	list!: Notice[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
