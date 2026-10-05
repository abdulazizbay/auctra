import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

export interface SocialProfile {
	socialId: string;
	name?: string;
	email?: string;
	image?: string;
}

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		private googleClient: OAuth2Client,
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
	public async verifyGoogle(token: string): Promise<SocialProfile> {
		try {
			if (!process.env.GOOGLE_CLIENT_ID) throw new Error();
			const ticket = await this.googleClient.verifyIdToken({
				idToken: token,
				audience: process.env.GOOGLE_CLIENT_ID,
			});
			const payload = ticket.getPayload();
			if (!payload?.sub) throw new Error();
			return {
				socialId: payload.sub,
				name: payload.given_name ?? payload.name,
				email: payload.email_verified ? payload.email : undefined,
				image: payload.picture,
			};
		} catch (err) {
			throw new UnauthorizedException(Message.SOCIAL_LOGIN_FAILED);
		}
	}

	public async comparePasswords(
		password: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}
}
