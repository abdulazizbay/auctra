import { Field, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@ObjectType()
export class MeWatched {
	@Field(() => String)
	memberId!: Types.ObjectId;

	@Field(() => String)
	lotId!: Types.ObjectId;

	@Field(() => Boolean)
	myWatch!: boolean;
}

@ObjectType()
export class Watch {
	@Field(() => String)
	_id!: Types.ObjectId;

	@Field(() => String)
	memberId!: Types.ObjectId;

	@Field(() => String)
	lotId!: Types.ObjectId;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
