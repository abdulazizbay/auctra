import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Member } from '../../libs/dto/member/member';
import { MemberInput } from '../../libs/dto/member/member.input';
import { InternalServerErrorException } from '@nestjs/common';
import { MemberService } from './member.service';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}
	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		try {
			console.log('Mutation: signup');
			return await this.memberService.signup(input);
		} catch (err) {
			console.log('Error, signup', err);
			throw new InternalServerErrorException(err);
		}
	}
}
