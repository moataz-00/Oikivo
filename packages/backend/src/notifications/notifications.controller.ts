import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.notificationsService.findAll(
      user.id,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: UserEntity) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  getUnreadCount(@CurrentUser() user: UserEntity) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.notificationsService.markRead(id, user.id);
  }

  /**
   * GET /notifications/stream
   * Server-Sent Events endpoint for real-time notification delivery.
   * The client should connect with:
   *   const es = new EventSource('/notifications/stream', { headers: { Authorization: `Bearer ${token}` } })
   *   es.onmessage = (e) => { const notif = JSON.parse(e.data); ... }
   */
  @Sse('stream')
  @ApiOperation({ summary: 'Server-Sent Events stream for real-time notifications' })
  streamNotifications(@CurrentUser() user: UserEntity): Observable<MessageEvent> {
    return this.notificationsService.stream(user.id);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register FCM push token for mobile notifications' })
  registerPushToken(
    @CurrentUser() user: UserEntity,
    @Body('token') token: string,
  ) {
    return this.pushService.registerToken(user.id, token);
  }

  @Delete('push-token')
  @ApiOperation({ summary: 'Remove FCM push token' })
  removePushToken(@CurrentUser() user: UserEntity) {
    return this.pushService.removeToken(user.id);
  }
}
