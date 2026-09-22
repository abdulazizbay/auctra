import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
	PENDING_PAYMENT = 'PENDING_PAYMENT',
	PAID = 'PAID',
	SHIPPED = 'SHIPPED',
	COMPLETED = 'COMPLETED',
	EXPIRED = 'EXPIRED',
	CANCELLED = 'CANCELLED',
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });
