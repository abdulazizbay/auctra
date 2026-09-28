import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();

		return await bcrypt.hash(memberPassword, salt);
	}
	public async createToken(member: Member): Promise<string> {
		return await this.jwtService.signAsync({ _id: String(member._id) });
	}

	public async verifyToken(token: string): Promise<Member | null> {
		try {
			const { _id } = await this.jwtService.verifyAsync(token);
			return await this.memberModel
				.findOne({ _id, memberStatus: MemberStatus.ACTIVE })
				.lean()
				.exec();
		} catch (err) {
			return null;
		}
	}
	public async comparePasswords(
		password: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}
}
