import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

function msgImageStorage(conversationId: string) {
  return diskStorage({
    destination: (req, file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'messages', conversationId);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `img-${unique}${extname(file.originalname)}`);
    },
  });
}

const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: (err: Error | null, ok: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  getConversations(@CurrentUser() user: UserEntity) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: UserEntity,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      user.id,
      parseInt(page) || 1,
      parseInt(limit) || 50,
    );
  }

  /** Send a text message to an existing conversation */
  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a text message to an existing conversation' })
  sendToConversation(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: UserEntity,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(user.id, { ...dto, conversationId });
  }

  /** Upload an image message to a conversation */
  @Post('conversations/:id/upload')
  @ApiOperation({ summary: 'Upload an image message' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const convId = req.params.id ?? 'unknown';
          const dir = join(process.cwd(), 'uploads', 'messages', convId);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `img-${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  uploadMessageImage(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const relativePath = `messages/${conversationId}/${file.filename}`;
    return this.messagesService.sendImageMessage(user.id, conversationId, relativePath);
  }

  /** Start a new conversation (guest → host) and send first message */
  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation or send to existing' })
  startOrSend(@CurrentUser() user: UserEntity, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(user.id, dto);
  }

  /** Legacy: send a message (kept for backward compat) */
  @Post()
  @ApiOperation({ summary: 'Send a message (legacy)' })
  sendMessage(@CurrentUser() user: UserEntity, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(user.id, dto);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  markRead(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.markRead(conversationId, user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread messages count' })
  getUnreadCount(@CurrentUser() user: UserEntity) {
    return this.messagesService.getUnreadCount(user.id);
  }
}
