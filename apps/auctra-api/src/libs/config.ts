import { Types } from 'mongoose';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { T } from './types/common';

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new Types.ObjectId(target) : target;
};

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
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

export const availableArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];

export const availableCommentSorts = ['createdAt', 'updatedAt'];

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

export const lookAuthMemberLiked = (memberId: T | null, targetRefId: string = '$_id') => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$likeRefId', '$$localLikeRefId'] },
								{ $eq: ['$memberId', '$$localMemberId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface LookAuthMemberFollowed {
	followerId: T | null;
	followingId: string;
}

export const lookAuthMemberFollowed = (input: LookAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$followerId', '$$localFollowerId'] },
								{ $eq: ['$followingId', '$$localFollowingId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followingId: 1,
						followerId: 1,
						myFollowing: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};
