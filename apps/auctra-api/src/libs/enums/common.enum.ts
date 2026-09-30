import { registerEnumType } from '@nestjs/graphql';

export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',
	UPLOAD_FAILED = 'Upload failed!',
	BAD_REQUEST = 'Bad Request',

	USED_MEMBER_NICK_OR_PHONE = 'Already used memberNick or phone!',
	NO_MEMBER_NICK = 'No member with that member nick!',
	BLOCKED_USER = 'You have been blocked!',
	WRONG_PASSWORD = 'Wrong password, try again!',
	NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
	TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
	NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
	SELF_FOLLOW_DENIED = 'Self follow is denied!',
	SELF_LIKE_DENIED = 'Self like is denied!',

	INVALID_LOT_TIME = 'Lot must start now or later and end after it starts!',
	INVALID_CEILING_PRICE = 'Ceiling price must be higher than start price!',
	LOT_NOT_EDITABLE = 'Lot not found, already has bids, or is closed!',
	BID_NOT_ACCEPTED = 'Bid not accepted: lot is closed, bid is too low, it is your own lot, or you are already the highest bidder!',
	ORDER_ADDRESS_REQUIRED = 'Shipping address is required to pay!',
	REVIEW_NOT_ALLOWED = 'Only the buyer of a completed order can review it!',
}

export enum Direction {
	ASC = 1,
	DESC = -1,
}
registerEnumType(Direction, { name: 'Direction' });
