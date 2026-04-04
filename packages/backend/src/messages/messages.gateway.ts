import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Real-time WebSocket gateway for the messaging feature.
 *
 * Flow:
 *  1. Client connects with ?token=<JWT> in handshake query.
 *  2. Client emits `join` with { conversationId } to subscribe to a room.
 *  3. When MessagesService saves a message it calls gateway.emitMessage()
 *     which broadcasts `new-message` to everyone in that room.
 *  4. Client emits `leave` with { conversationId } to unsubscribe.
 */
@WebSocketGateway({
  namespace: 'messages',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  // socket.id → userId
  private readonly connectedUsers = new Map<string, number>();

  constructor(private readonly config: ConfigService) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    const token =
      (client.handshake.query?.token as string | undefined) ||
      (client.handshake.auth?.token as string | undefined);

    if (!token) {
      this.logger.warn(`WS reject (no token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = jwt.verify(token, secret) as unknown as { sub: number };
      this.connectedUsers.set(client.id, payload.sub);
      this.logger.debug(`WS connected: userId=${payload.sub} socket=${client.id}`);
    } catch {
      this.logger.warn(`WS reject (invalid token): ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.logger.debug(`WS disconnected: socket=${client.id}`);
  }

  // ─── Subscribe to a conversation room ────────────────────────────────────

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId || !data?.conversationId) return;
    const room = `conversation:${data.conversationId}`;
    client.join(room);
    this.logger.debug(`userId=${userId} joined room ${room}`);
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.leave(room);
  }

  // ─── Outbound: called by MessagesService after saving a message ───────────

  emitMessage(conversationId: number, message: Record<string, unknown>) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new-message', message);
  }

  /** Notify a specific user's socket(s) about a new conversation */
  emitConversationUpdate(userId: number, payload: Record<string, unknown>) {
    for (const [socketId, uid] of this.connectedUsers) {
      if (uid === userId) {
        this.server.to(socketId).emit('conversation-update', payload);
      }
    }
  }
}
