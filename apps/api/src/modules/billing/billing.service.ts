import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanTier, PlanStatus } from '@prisma/client';
import Stripe from 'stripe';

/** Plan limits enforced across the app */
export const PLAN_LIMITS: Record<
  PlanTier,
  { maxSources: number; maxMembers: number; channels: string[] }
> = {
  FREE_TRIAL: { maxSources: 3, maxMembers: 1, channels: ['EMAIL'] },
  STARTER: { maxSources: 10, maxMembers: 2, channels: ['EMAIL', 'SLACK'] },
  PRO: { maxSources: 50, maxMembers: 10, channels: ['EMAIL', 'SLACK'] },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;
  private readonly starterPriceId: string;
  private readonly proPriceId: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY', '');
    this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
    this.starterPriceId = this.config.get<string>('STRIPE_PRICE_ID_STARTER', '');
    this.proPriceId = this.config.get<string>('STRIPE_PRICE_ID_PRO', '');
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  // ── Checkout ────────────────────────────────

  async createCheckoutSession(teamId: string, planTier: 'STARTER' | 'PRO') {
    const team = await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });

    const priceId = planTier === 'STARTER' ? this.starterPriceId : this.proPriceId;
    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for ${planTier}`);
    }

    // Re-use existing Stripe customer if we have one
    let customerId = team.stripeCustomerId ?? undefined;
    if (!customerId) {
      // Look up owning user email for the customer record
      const owner = await this.prisma.user.findFirst({
        where: { teamId, isOwner: true },
        select: { email: true, name: true },
      });

      const customer = await this.stripe.customers.create({
        metadata: { teamId },
        email: owner?.email ?? undefined,
        name: owner?.name ?? undefined,
      });
      customerId = customer.id;

      await this.prisma.team.update({
        where: { id: teamId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get<string>('NEXTAUTH_URL', 'http://localhost:3000')}/dashboard/settings?billing=success`,
      cancel_url: `${this.config.get<string>('NEXTAUTH_URL', 'http://localhost:3000')}/dashboard/settings?billing=cancelled`,
      metadata: { teamId, planTier },
      subscription_data: { metadata: { teamId, planTier } },
    });

    return { url: session.url };
  }

  // ── Customer Portal ─────────────────────────

  async createCustomerPortalSession(teamId: string) {
    const team = await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });

    if (!team.stripeCustomerId) {
      throw new BadRequestException('No billing account found. Subscribe to a plan first.');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: team.stripeCustomerId,
      return_url: `${this.config.get<string>('NEXTAUTH_URL', 'http://localhost:3000')}/dashboard/settings`,
    });

    return { url: session.url };
  }

  // ── Webhook ─────────────────────────────────

  async handleWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.onPaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  // ── Webhook handlers ────────────────────────

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const teamId = session.metadata?.teamId;
    const planTier = session.metadata?.planTier as 'STARTER' | 'PRO' | undefined;
    if (!teamId || !planTier) {
      this.logger.warn('checkout.session.completed missing metadata');
      return;
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        plan: planTier as PlanTier,
        planStatus: PlanStatus.ACTIVE,
        stripeCustomerId: customerId ?? undefined,
        stripeSubscriptionId: subscriptionId ?? undefined,
      },
    });

    this.logger.log(`Team ${teamId} activated on ${planTier} plan`);
  }

  private async onSubscriptionUpdated(subscription: Stripe.Subscription) {
    const teamId = subscription.metadata?.teamId;
    if (!teamId) {
      this.logger.warn('subscription.updated missing teamId metadata');
      return;
    }

    // Determine plan from price
    const priceId = subscription.items.data[0]?.price?.id;
    let plan: PlanTier = PlanTier.FREE_TRIAL;
    if (priceId === this.starterPriceId) plan = PlanTier.STARTER;
    else if (priceId === this.proPriceId) plan = PlanTier.PRO;

    const statusMap: Record<string, PlanStatus> = {
      active: PlanStatus.ACTIVE,
      past_due: PlanStatus.PAST_DUE,
      canceled: PlanStatus.CANCELLED,
      unpaid: PlanStatus.PAST_DUE,
    };
    const planStatus = statusMap[subscription.status] ?? PlanStatus.ACTIVE;

    await this.prisma.team.update({
      where: { id: teamId },
      data: { plan, planStatus },
    });

    this.logger.log(`Team ${teamId} subscription updated: ${plan} / ${planStatus}`);
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    const teamId = subscription.metadata?.teamId;
    if (!teamId) {
      this.logger.warn('subscription.deleted missing teamId metadata');
      return;
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        plan: PlanTier.FREE_TRIAL,
        planStatus: PlanStatus.CANCELLED,
        stripeSubscriptionId: null,
      },
    });

    this.logger.log(`Team ${teamId} subscription cancelled — downgraded to FREE_TRIAL`);
  }

  private async onPaymentFailed(invoice: Stripe.Invoice) {
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

    if (!customerId) return;

    const team = await this.prisma.team.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!team) {
      this.logger.warn(`Payment failed for unknown customer ${customerId}`);
      return;
    }

    await this.prisma.team.update({
      where: { id: team.id },
      data: { planStatus: PlanStatus.PAST_DUE },
    });

    this.logger.log(`Team ${team.id} marked as PAST_DUE after payment failure`);
  }

  // ── Plan enforcement helpers ────────────────

  async getTeamPlan(teamId: string) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { plan: true, planStatus: true, stripeCustomerId: true, stripeSubscriptionId: true },
    });
    const limits = PLAN_LIMITS[team.plan];
    return { ...team, limits };
  }

  async checkSourceLimit(teamId: string): Promise<{ allowed: boolean; current: number; max: number; plan: PlanTier }> {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { plan: true },
    });
    const limits = PLAN_LIMITS[team.plan];
    const currentCount = await this.prisma.apiSource.count({ where: { teamId } });
    return {
      allowed: currentCount < limits.maxSources,
      current: currentCount,
      max: limits.maxSources,
      plan: team.plan,
    };
  }

  async checkMemberLimit(teamId: string): Promise<{ allowed: boolean; current: number; max: number; plan: PlanTier }> {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { plan: true },
    });
    const limits = PLAN_LIMITS[team.plan];
    const currentCount = await this.prisma.user.count({ where: { teamId } });
    return {
      allowed: currentCount < limits.maxMembers,
      current: currentCount,
      max: limits.maxMembers,
      plan: team.plan,
    };
  }
}
