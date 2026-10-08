import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Model, Types } from 'mongoose';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import * as url from 'url';
import Redis from 'ioredis';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import { Order } from '../libs/dto/order/order';
import { T } from '../libs/types/common';
import { redisConnection } from '../libs/config';
import { Message } from '../libs/enums/common.enum';

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member | null;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member | null;
	action: string;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClient: number = 0;
	private clientsAuthMap = new Map<WebSocket, Member | null>();
	private rooms = new Map<string, Set<WebSocket>>();
	private messagesList: MessagePayload[] = [];
	private clientKeys = new Map<WebSocket, string>();
	private redis = new Redis({ ...redisConnection(), enableOfflineQueue: false });

	constructor(
		private authService: AuthService,
		@InjectModel('Order') private readonly orderModel: Model<Order>,
	) {}

	@WebSocketServer()
	server!: Server;

	public afterInit(server: Server) {
		this.logger.verbose(
			`WebSocket Server Initialized & total [${this.summaryClient}]`,
		);
	}

	private async isRateLimited(client: WebSocket): Promise<boolean> {
		const key = `ws-message:${this.clientKeys.get(client)}`;
		try {
			const hits = await this.redis.incr(key);
			if (hits === 1) await this.redis.pexpire(key, 10_000);
			return hits > 5;
		} catch (err) {
			return false;
		}
	}

	private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const parseUrl = url.parse(req.url, true);
			const { token } = parseUrl.query;
			return await this.authService.verifyToken(token as string);
		} catch (err) {
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: any) {
		const authMember = await this.retrieveAuth(req);
		this.summaryClient++;
		this.clientsAuthMap.set(client, authMember);
		this.clientKeys.set(client, authMember ? `member:${authMember._id}` : `ip:${req.socket.remoteAddress}`);
		if (authMember) this.joinRoom(client, `member:${authMember._id}`);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(
			`Connection [${clientNick}] total [${this.summaryClient}]`,
		);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: authMember,
			action: 'joined',
		};
		this.emitMessage(infoMsg);
		client.send(
			JSON.stringify({ event: 'getMessages', list: this.messagesList }),
		);
	}

	public handleDisconnect(client: WebSocket) {
		const authMember = this.clientsAuthMap.get(client) ?? null;
		this.summaryClient--;
		this.clientsAuthMap.delete(client);
		this.clientKeys.delete(client);
		this.rooms.forEach((clients, room) => {
			clients.delete(client);
			if (!clients.size) this.rooms.delete(room);
		});

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(
			`Disconnection [${clientNick}] total [${this.summaryClient}]`,
		);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: authMember,
			action: 'left',
		};
		this.broadcastMessage(client, infoMsg);
	}

	@SubscribeMessage('message')
	public async handleMessage(
		client: WebSocket,
		payload: string,
	): Promise<void> {
		if (await this.isRateLimited(client)) {
			client.send(JSON.stringify({ event: 'error', message: Message.TOO_MANY_REQUESTS }));
			return;
		}
		const authMember = this.clientsAuthMap.get(client) ?? null;
		const newMessage: MessagePayload = {
			event: 'message',
			text: payload,
			memberData: authMember,
		};

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`NEW MESSAGE [${clientNick}]: ${payload}`);

		this.messagesList.push(newMessage);
		if (this.messagesList.length > 5)
			this.messagesList.splice(0, this.messagesList.length - 5);

		this.emitMessage(newMessage);
	}

	@SubscribeMessage('join')
	public async handleJoin(client: WebSocket, room: string): Promise<void> {
		const [type, id] = String(room).split(':');
		if (!id || !Types.ObjectId.isValid(id)) return this.sendError(client, room);

		if (type === 'lot') return this.joinRoom(client, room);

		if (type === 'order') {
			const authMember = this.clientsAuthMap.get(client);
			if (!authMember) return this.sendError(client, room);
			const isParticipant = await this.orderModel
				.exists({
					_id: id,
					$or: [{ buyerId: authMember._id }, { sellerId: authMember._id }],
				})
				.exec();
			if (!isParticipant) return this.sendError(client, room);
			return this.joinRoom(client, room);
		}

		this.sendError(client, room);
	}

	@SubscribeMessage('leave')
	public handleLeave(client: WebSocket, room: string): void {
		this.rooms.get(room)?.delete(client);
	}

	public emitToRoom(room: string, message: T) {
		this.rooms.get(room)?.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	private joinRoom(client: WebSocket, room: string) {
		if (!this.rooms.has(room)) this.rooms.set(room, new Set());
		this.rooms.get(room)!.add(client);
		client.send(JSON.stringify({ event: 'joined', room: room }));
	}

	private sendError(client: WebSocket, room: string) {
		client.send(JSON.stringify({ event: 'error', room: room }));
	}

	private broadcastMessage(
		sender: WebSocket,
		message: InfoPayload | MessagePayload,
	) {
		this.server.clients.forEach((client) => {
			if (client !== sender && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	private emitMessage(message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}
}
