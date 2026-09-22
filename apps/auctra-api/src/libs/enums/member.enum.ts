import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
	USER = 'USER',
	SELLER = 'SELLER',
	ADMIN = 'ADMIN',
}
registerEnumType(MemberType, { name: 'MemberType' });

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}
registerEnumType(MemberStatus, { name: 'MemberStatus' });

export enum MemberLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	DAEJEON = 'DAEJEON',
	GWANGJU = 'GWANGJU',
	ULSAN = 'ULSAN',
	SEJONG = 'SEJONG',
	SUWON = 'SUWON',
	JEJU = 'JEJU',
}
registerEnumType(MemberLocation, { name: 'MemberLocation' });

export enum MemberSellerStatus {
	NONE = 'NONE',
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}
registerEnumType(MemberSellerStatus, { name: 'MemberSellerStatus' });
