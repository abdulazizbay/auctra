import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { Message } from '../libs/enums/common.enum';
import { T } from '../libs/types/common';
import { SocketGateway } from './socket.gateway';

// only for batch
@Controller('socket')
export class SocketController {
	constructor(private readonly socketGateway: SocketGateway) {}

	@Post('emit')
	public emit(@Headers('x-batch-secret') secret: string, @Body() input: { room: string; message: T }): void {
		if (secret !== process.env.SECRET_TOKEN) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		this.socketGateway.emitToRoom(input.room, input.message);
	}
}
