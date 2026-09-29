 import { Types } from 'mongoose';

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new Types.ObjectId(target) : target;
};

export const availableSellerSorts = [
	'createdAt',
	'updatedAt',
	'memberAvgRating',
	'memberSalesCount',
	'memberFollowers',
	'memberLikes',
	"memberViews"
];

export const availableMemberSorts = [
	'createdAt',
	'updatedAt',
	'memberLikes',
	'memberViews',
	'memberSellerAppliedAt',
];

export const availableLotSorts = [
	'createdAt',
	'lotEndsAt',
	'lotCurrentPrice',
	'lotBids',
	'lotWatchers',
	'lotPopular',
];

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupOrderItems = {
	$lookup: {
		from: 'orderItems',
		localField: '_id',
		foreignField: 'orderId',
		as: 'orderItems',
	},
};

export const lookupOrderLots = {
	$lookup: {
		from: 'lots',
		localField: 'orderItems.lotId',
		foreignField: '_id',
		as: 'lotData',
	},
};
