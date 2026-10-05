import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Types } from 'mongoose';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
	protected getRequestResponse(context: ExecutionContext) {
		const ctx = GqlExecutionContext.create(context).getContext();
		return { req: ctx.req, res: ctx.res };
	}

	protected async getTracker(req: Record<string, any>): Promise<string> {
		const memberId = req.body?.authMember?._id;
		return memberId instanceof Types.ObjectId ? `member:${memberId}` : `ip:${req.ip}`;
	}
}
