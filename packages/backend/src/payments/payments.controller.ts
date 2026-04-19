import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Create a Stripe PaymentIntent for a booking' })
  createIntent(
    @CurrentUser() user: UserEntity,
    @Body() body: { bookingId: number; bookingType: 'stay' | 'experience' },
  ) {
    return this.paymentsService.createPaymentIntent(user.id, body.bookingId, body.bookingType);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a Stripe payment for a booking' })
  refund(
    @CurrentUser() user: UserEntity,
    @Body() body: { bookingId: number; bookingType: 'stay' | 'experience'; reason?: string },
  ) {
    return this.paymentsService.refundBooking(user.id, body.bookingId, body.bookingType, body.reason);
  }

  // ─── OPay ─────────────────────────────────────────────────────────────────

  // FIX P1: Replaced raw card endpoint with OPay hosted checkout — card data never touches backend (PCI compliant)
  @Post('opay/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Create OPay hosted checkout session (PCI compliant — no card data passes through backend)' })
  opayCheckout(
    @CurrentUser() user: UserEntity,
    @Body()
    body: {
      bookingId: number;
      bookingType: 'stay' | 'experience';
      returnUrl?: string;
    },
  ) {
    return this.paymentsService.createOpayCheckout(
      user.id,
      body.bookingId,
      body.bookingType,
      body.returnUrl ?? '',
    );
  }

  @Post('opay/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund an OPay payment for a booking' })
  opayRefund(
    @CurrentUser() user: UserEntity,
    @Body() body: { bookingId: number; bookingType: 'stay' | 'experience'; reason?: string },
  ) {
    return this.paymentsService.refundOpayBooking(
      user.id,
      body.bookingId,
      body.bookingType,
      body.reason,
    );
  }

  /**
   * OPay callback endpoint — called by OPay servers when payment status changes.
   * No JWT guard — authenticated via OPay HMAC signature verification in the service.
   */
  @Post('opay/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OPay payment callback (webhook)' })
  async opayCallback(
    @Body() body: Record<string, any>,
    @Headers('authorization') auth: string,
    @Headers('merchantid') merchantId: string,
  ) {
    await this.paymentsService.handleOpayCallback(body, auth, merchantId);
    return { received: true };
  }

  /**
   * Stripe webhook endpoint.
   * This route must receive the raw request body — configure Express rawBody
   * via `app.useBodyParser(false)` or by setting `rawBody: true` in NestFactory.create.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody;
    if (!payload) {
      return { received: true }; // no-op if rawBody not enabled yet
    }
    await this.paymentsService.handleWebhook(payload, signature);
    return { received: true };
  }
}
