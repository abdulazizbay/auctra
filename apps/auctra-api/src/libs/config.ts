import { Types } from 'mongoose';
import { T } from './types/common';

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

export const lookupBuyerData = {
	$lookup: {
		from: 'members',
		localField: 'buyerId',
		foreignField: '_id',
		as: 'buyerData',
	},
};

export const lookAuthMemberWatched = (memberId: T | null, targetRefId: string = '$_id') => {
	return {
		$lookup: {
			from: 'watches',
			let: {
				localLotId: targetRefId,
				localMemberId: memberId,
				localMyWatch: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$lotId', '$$localLotId'] },
								{ $eq: ['$memberId', '$$localMemberId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						lotId: 1,
						myWatch: '$$localMyWatch',
					},
				},
			],
			as: 'meWatched',
		},
	};
};
