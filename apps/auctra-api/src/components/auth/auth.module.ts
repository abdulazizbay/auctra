import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		JwtModule.registerAsync({
			useFactory: () => ({
				secret: process.env.SECRET_TOKEN,
				signOptions: { expiresIn: '30d' },
			}),
		}),
	],
	providers: [
		AuthService,
		{ provide: OAuth2Client, useFactory: () => new OAuth2Client() },
	],
	exports: [AuthService],
})
export class AuthModule {}
