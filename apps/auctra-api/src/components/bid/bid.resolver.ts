import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Bid, Bids } from '../../libs/dto/bid/bid';
import { BidInput, BidsInquiry } from '../../libs/dto/bid/bid.input';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Member } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { BidService } from './bid.service';

@Resolver()
export class BidResolver {
	constructor(private readonly bidService: BidService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Bid)
	public async placeBid(
		@Args('input') input: BidInput,
		@AuthMember() authMember: Member,
	): Promise<Bid> {
		console.log('Mutation: placeBid');
		input.lotId = shapeIntoMongoObjectId(input.lotId);
		return await this.bidService.placeBid(authMember, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Bids)
	public async getBids(
		@Args('input') input: BidsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Bids> {
		console.log('Query: getBids');
		input.search.lotId = shapeIntoMongoObjectId(input.search.lotId);
		return await this.bidService.getBids(memberId, input);
	}
}
