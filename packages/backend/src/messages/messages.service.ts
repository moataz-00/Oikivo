import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../entities/conversation.entity';
import { MessageEntity } from '../entities/message.entity';
import { UserEntity } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService, tplNewMessage } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationsRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messagesRepo: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    private notificationsService: NotificationsService,
    private mail: MailService,
    private config: ConfigService,
    @Inject(forwardRef(() => MessagesGateway))
    private gateway: MessagesGateway,
  ) {}

  async getOrCreateConversation(
    guestId: number,
    hostId: number,
    propertyId?: number,
    bookingId?: number,
  ): Promise<ConversationEntity> {
    // Try to find existing conversation
    const queryBuilder = this.conversationsRepo
      .createQueryBuilder('conv')
      .where('conv.guestId = :guestId', { guestId })
      .andWhere('conv.hostId = :hostId', { hostId });

    if (propertyId) {
      queryBuilder.andWhere('conv.propertyId = :propertyId', { propertyId });
    }

    let conversation = await queryBuilder.getOne();

    if (!conversation) {
      conversation = this.conversationsRepo.create({
        guestId,
        hostId,
        propertyId: propertyId || null,
        bookingId: bookingId || null,
      });
      conversation = await this.conversationsRepo.save(conversation);
    }

    return conversation;
  }

  async sendMessage(senderId: number, dto: SendMessageDto): Promise<MessageEntity> {
    let conversationId = dto.conversationId;
    let conversation: ConversationEntity | null = null;

    if (!conversationId) {
      if (!dto.hostId) {
        throw new BadRequestException('hostId is required to start a new conversation');
      }

      const sender = await this.usersRepo.findOne({ where: { id: senderId } });
      if (!sender) throw new NotFoundException('Sender not found');

      const host = await this.usersRepo.findOne({ where: { id: dto.hostId } });
      if (!host) throw new NotFoundException('Host not found');

      // Determine guest and host based on isHost flag
      const guestId = sender.isHost ? dto.hostId : senderId;
      const hostId = sender.isHost ? senderId : dto.hostId;

      // Reuse the conversation returned by getOrCreateConversation — no second DB round-trip
      conversation = await this.getOrCreateConversation(guestId, hostId, dto.propertyId);
      conversationId = conversation.id;
    }

    // Only fetch when working with a pre-existing conversationId from the DTO
    if (!conversation) {
      conversation = await this.conversationsRepo.findOne({ where: { id: conversationId } });
      if (!conversation) throw new NotFoundException('Conversation not found');
    }

    // Verify sender is part of the conversation
    if (conversation.guestId !== senderId && conversation.hostId !== senderId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    const message = this.messagesRepo.create({
      conversationId,
      senderId,
      body: dto.body ?? '',
      messageType: dto.messageType ?? 'text',
      imageUrl: dto.imageUrl ?? null,
    });

    const saved = await this.messagesRepo.save(message);

    // Emit real-time event to all sockets in this conversation room
    try {
      this.gateway.emitMessage(conversationId, {
        id: saved.id,
        conversationId,
        senderId,
        body: saved.body,
        messageType: saved.messageType,
        imageUrl: saved.imageUrl,
        isRead: false,
        createdAt: saved.createdAt,
      });
    } catch { /* gateway may not be ready during startup */ }

    // Touch conversation updated_at so the list stays sorted by activity
    await this.conversationsRepo.update(conversationId, { updatedAt: new Date() });

    // Notify the receiver
    const receiverId =
      conversation.guestId === senderId ? conversation.hostId : conversation.guestId;

    await this.notificationsService.create(
      receiverId,
      'new_message',
      'New Message',
      'رسالة جديدة',
      `You have a new message`,
      `لديك رسالة جديدة`,
      { conversationId, messageId: saved.id },
    );

    // Send email to receiver
    void (async () => {
      try {
        const [sender, receiver] = await Promise.all([
          this.usersRepo.findOne({ where: { id: senderId } }),
          this.usersRepo.findOne({ where: { id: receiverId } }),
        ]);
        if (sender && receiver) {
          const fe = (this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0]?.trim()) || 'http://localhost:3000';
          const inboxUrl = `${fe.replace(/\/+$/, '')}/en/inbox`;
          await this.mail.send(
            receiver.email,
            `New message from ${sender.firstName} — Journey Stay`,
            tplNewMessage(receiver.firstName, sender.firstName, (dto.body ?? '').slice(0, 200), inboxUrl),
          );
        }
      } catch { /* non-critical */ }
    })();

    return saved;
  }

  async getConversations(userId: number) {
    const conversations = await this.conversationsRepo
      .createQueryBuilder('conv')
      .leftJoinAndSelect('conv.guest', 'guest')
      .leftJoinAndSelect('conv.host', 'host')
      .leftJoinAndSelect('conv.property', 'property')
      .leftJoinAndSelect('property.photos', 'photos', 'photos.isCover = true')
      .where('conv.guestId = :userId OR conv.hostId = :userId', { userId })
      .orderBy('conv.updatedAt', 'DESC')
      .getMany();

    if (!conversations.length) return [];

    const convIds = conversations.map((c) => c.id);

    // Last message per conversation — one query instead of N
    const lastMessages = await this.messagesRepo
      .createQueryBuilder('msg')
      .where('msg.conversationId IN (:...convIds)', { convIds })
      .orderBy('msg.createdAt', 'DESC')
      .getMany();
    const lastMessageMap = new Map<number, MessageEntity>();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, msg);
      }
    }

    // Unread counts per conversation — one aggregation query instead of N
    const unreadRows: Array<{ conversationId: number; cnt: string }> = await this.messagesRepo
      .createQueryBuilder('msg')
      .select('msg.conversationId', 'conversationId')
      .addSelect('COUNT(*)', 'cnt')
      .where('msg.conversationId IN (:...convIds)', { convIds })
      .andWhere('msg.isRead = false')
      .andWhere('msg.senderId != :userId', { userId })
      .groupBy('msg.conversationId')
      .getRawMany();
    const unreadMap = new Map<number, number>();
    for (const row of unreadRows) {
      unreadMap.set(Number(row.conversationId), Number(row.cnt));
    }

    return conversations.map((conv) => ({
      ...conv,
      participants: [conv.guest, conv.host].filter(Boolean),
      lastMessage: lastMessageMap.get(conv.id) ?? null,
      unreadCount: unreadMap.get(conv.id) ?? 0,
    }));
  }

  async getMessages(conversationId: number, userId: number, page = 1, limit = 30) {
    const conversation = await this.conversationsRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.guestId !== userId && conversation.hostId !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    const [items, total] = await this.messagesRepo.findAndCount({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Return flat array for simplicity (keep pagination metadata too)
    return {
      items: items.reverse(),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markRead(conversationId: number, userId: number): Promise<{ message: string }> {
    const conversation = await this.conversationsRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.guestId !== userId && conversation.hostId !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    // Mark all messages NOT sent by this user as read
    const senderId =
      conversation.guestId === userId ? conversation.hostId : conversation.guestId;

    await this.messagesRepo
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ isRead: true })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId = :senderId', { senderId })
      .andWhere('isRead = false')
      .execute();

    return { message: 'Messages marked as read' };
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const row: { total: string } = await this.messagesRepo
      .createQueryBuilder('msg')
      .select('COUNT(*)', 'total')
      .innerJoin('msg.conversation', 'conv',
        'conv.guestId = :userId OR conv.hostId = :userId', { userId })
      .where('msg.senderId != :userId', { userId })
      .andWhere('msg.isRead = false')
      .getRawOne();

    return { count: Number(row?.total ?? 0) };
  }

  async sendImageMessage(
    senderId: number,
    conversationId: number,
    imageRelativePath: string,
  ): Promise<MessageEntity> {
    const conversation = await this.conversationsRepo.findOne({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.guestId !== senderId && conversation.hostId !== senderId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    const message = this.messagesRepo.create({
      conversationId,
      senderId,
      body: '',
      messageType: 'image',
      imageUrl: imageRelativePath,
    });

    const saved = await this.messagesRepo.save(message);
    await this.conversationsRepo.update(conversationId, { updatedAt: new Date() });

    const receiverId =
      conversation.guestId === senderId ? conversation.hostId : conversation.guestId;

    await this.notificationsService.create(
      receiverId,
      'new_message',
      'New Message',
      'رسالة جديدة',
      'You received an image',
      'استلمت صورة',
      { conversationId, messageId: saved.id },
    );

    return saved;
  }
}
