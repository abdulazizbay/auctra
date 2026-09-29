import { Types } from 'mongoose';
import { ViewGroup } from '../../enums/view.enum';

export interface ViewInput {
	memberId: Types.ObjectId;
	viewRefId: Types.ObjectId;
	viewGroup: ViewGroup;
}
