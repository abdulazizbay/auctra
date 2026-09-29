import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Lot, Lots } from '../../libs/dto/lot/lot';
import { LotInput, LotsInquiry, OrdinaryInquiry } from '../../libs/dto/lot/lot.input';
import { LotUpdate } from '../../libs/dto/lot/lot.update';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { LotService } from './lot.service';

@Resolver()
export class LotResolver {
	constructor(private readonly lotService: LotService) {}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Mutation(() => Lot)
	public async createLot(
		@Args('input') input: LotInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Lot> {
		console.log('Mutation: createLot');
		return await this.lotService.createLot(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Lot)
	public async getLot(
		@Args('lotId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Lot> {
		console.log('Query: getLot');
		const lotId = shapeIntoMongoObjectId(input);
		return await this.lotService.getLot(memberId, lotId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Lots)
	public async getLots(
		@Args('input') input: LotsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Lots> {
		console.log('Query: getLots');
		return await this.lotService.getLots(memberId, input);
	}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Mutation(() => Lot)
	public async updateLot(
		@Args('input') input: LotUpdate,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Lot> {
		console.log('Mutation: updateLot');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.lotService.updateLot(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Lot)
	public async watchTargetLot(
		@Args('lotId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Lot> {
		console.log('Mutation: watchTargetLot');
		const lotId = shapeIntoMongoObjectId(input);
		return await this.lotService.watchTargetLot(memberId, lotId);
	}

	@UseGuards(AuthGuard)
	@Query(() => Lots)
	public async getWatchedLots(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Lots> {
		console.log('Query: getWatchedLots');
		return await this.lotService.getWatchedLots(memberId, input);
	}

	// Admin

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Lot)
	public async updateLotByAdmin(@Args('input') input: LotUpdate): Promise<Lot> {
		console.log('Mutation: updateLotByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.lotService.updateLotByAdmin(input);
	}
}
