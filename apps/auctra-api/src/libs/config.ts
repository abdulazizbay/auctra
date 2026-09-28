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
