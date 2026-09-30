import { Types } from 'mongoose';
import { LikeGroup } from '../../enums/like.enum';

export interface LikeInput {
	memberId: Types.ObjectId;
	likeRefId: Types.ObjectId;
	likeGroup: LikeGroup;
}
