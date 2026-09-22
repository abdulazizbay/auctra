import { Schema } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../libs/enums/article.enum';

const ArticleSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		articleTitle: {
			type: String,
			required: true,
		},

		articleContent: {
			type: String,
			required: true,
		},

		articleImages: {
			type: [String],
		},

		articleCategory: {
			type: String,
			enum: ArticleCategory,
			required: true,
		},

		articleStatus: {
			type: String,
			enum: ArticleStatus,
			default: ArticleStatus.ACTIVE,
		},

		lotId: {
			type: Schema.Types.ObjectId,
			ref: 'Lot',
		},

		articleLikes: {
			type: Number,
			default: 0,
		},

		articleViews: {
			type: Number,
			default: 0,
		},

		articleComments: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'articles' },
);


export default ArticleSchema;
