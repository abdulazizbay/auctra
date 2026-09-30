import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { NoticeStatus, NoticeType } from '../../enums/notice.enum';

@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	noticeTitle!: string;

	@IsNotEmpty()
	@Length(3, 5000)
	@Field(() => String)
	noticeContent!: string;

	@IsNotEmpty()
	@Field(() => NoticeType)
	noticeType!: NoticeType;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	noticeOrder?: number;
}

@InputType()
class NoticeSearch {
	@IsOptional()
	@Field(() => NoticeType, { nullable: true })
	noticeType?: NoticeType;
}

@InputType()
export class NoticesInquiry {
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
	@Field(() => NoticeSearch)
	search!: NoticeSearch;
}

@InputType()
class AllNoticeSearch {
	@IsOptional()
	@Field(() => NoticeType, { nullable: true })
	noticeType?: NoticeType;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;
}

@InputType()
export class AllNoticesInquiry {
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
	@Field(() => AllNoticeSearch)
	search!: AllNoticeSearch;
}
