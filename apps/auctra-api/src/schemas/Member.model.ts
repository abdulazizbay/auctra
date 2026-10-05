import { Schema } from 'mongoose';
import {
	MemberAuthType,
	MemberLocation,
	MemberSellerStatus,
	MemberStatus,
	MemberType,
} from '../libs/enums/member.enum';

const MemberSchema = new Schema(
	{
		memberNick: {
			type: String,
			index: { unique: true, sparse: true },
			required: true,
		},

		memberPhone: {
			type: String,
			index: { unique: true, sparse: true },
			required: function () {
				return this.memberAuthType === MemberAuthType.LOCAL;
			},
		},

		memberEmail: {
			type: String,
			index: { unique: true, sparse: true },
		},

		memberPassword: {
			type: String,
			select: false,
			required: function () {
				return this.memberAuthType === MemberAuthType.LOCAL;
			},
		},

		memberAuthType: {
			type: String,
			enum: MemberAuthType,
			default: MemberAuthType.LOCAL,
		},

		memberSocialId: {
			type: String,
		},

		memberType: {
			type: String,
			enum: MemberType,
			default: MemberType.USER,
		},

		memberStatus: {
			type: String,
			enum: MemberStatus,
			default: MemberStatus.ACTIVE,
		},

		memberSellerStatus: {
			type: String,
			enum: MemberSellerStatus,
			default: MemberSellerStatus.NONE,
		},

		memberImage: {
			type: String,
			default: '',
		},

		memberFullName: {
			type: String,
		},

		memberBio: {
			type: String,
		},

		memberLocation: {
			type: String,
			enum: MemberLocation,
		},

		memberAddress: {
			type: String,
		},

		memberSellerDocUrl: {
			type: String,
		},

		memberSellerAppliedAt: {
			type: Date,
		},

		memberAvgRating: {
			type: Number,
			default: 0,
		},

		memberReviewCount: {
			type: Number,
			default: 0,
		},

		memberSalesCount: {
			type: Number,
			default: 0,
		},

		memberFollowers: {
			type: Number,
			default: 0,
		},

		memberFollowings: {
			type: Number,
			default: 0,
		},

		memberLikes: {
			type: Number,
			default: 0,
		},

		memberViews: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'members' },
);

MemberSchema.index(
	{ memberAuthType: 1, memberSocialId: 1 },
	// Only index members where socialId exist
	{
		unique: true,
		partialFilterExpression: { memberSocialId: { $exists: true } },
	},
);

export default MemberSchema;
