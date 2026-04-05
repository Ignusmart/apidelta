import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /** Create a Stripe Checkout session to subscribe */
  @Post('checkout')
  async createCheckout(
    @Body() body: { teamId: string; planTier: 'STARTER' | 'PRO' },
  ) {
    return this.billingService.createCheckoutSession(body.teamId, body.planTier);
  }

  /** Create a Stripe Customer Portal session for self-serve management */
  @Post('portal')
  async createPortal(@Body() body: { teamId: string }) {
    return this.billingService.createCustomerPortalSession(body.teamId);
  }

  /** Get team's current plan details and limits */
  @Get('plan')
  async getPlan(@Query('teamId') teamId: string) {
    return this.billingService.getTeamPlan(teamId);
  }

  /** Check if team can add another source */
  @Get('check-source-limit')
  async checkSourceLimit(@Query('teamId') teamId: string) {
    return this.billingService.checkSourceLimit(teamId);
  }

  /**
   * Stripe webhook handler.
   * Must receive raw body for signature verification.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      return { error: 'Missing raw body' };
    }
    return this.billingService.handleWebhook(rawBody, signature);
  }
}
