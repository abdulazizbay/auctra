import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Order, Orders } from '../../libs/dto/order/order';
import { OrdersInquiry } from '../../libs/dto/order/order.input';
import { OrderUpdate } from '../../libs/dto/order/order.update';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { OrderService } from './order.service';

@Resolver()
export class OrderResolver {
	constructor(private readonly orderService: OrderService) {}

	@UseGuards(AuthGuard)
	@Query(() => Orders)
	public async getMyOrders(
		@Args('input') input: OrdersInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Orders> {
		console.log('Query: getMyOrders');
		return await this.orderService.getMyOrders(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Orders)
	public async getMySales(
		@Args('input') input: OrdersInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Orders> {
		console.log('Query: getMySales');
		return await this.orderService.getMySales(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Order)
	public async getOrder(
		@Args('orderId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Order> {
		console.log('Query: getOrder');
		const orderId = shapeIntoMongoObjectId(input);
		return await this.orderService.getOrder(memberId, orderId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async updateOrder(
		@Args('input') input: OrderUpdate,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Order> {
		console.log('Mutation: updateOrder');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.orderService.updateOrder(memberId, input);
	}
}
