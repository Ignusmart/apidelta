import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanTier, PlanStatus } from '@prisma/client';
import { PLAN_LIMITS } from './billing.service';

/**
 * Guard that checks the team's subscription is active and within plan limits.
 *
 * Usage: Apply to routes that should be gated by billing status.
 * Expects `teamId` in request body or query params.
 */
@Injectable()
export class BillingGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const teamId = request.body?.teamId ?? request.query?.teamId;

    if (!teamId) {
      throw new ForbiddenException('Missing teamId');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { plan: true, planStatus: true },
    });

    if (!team) {
      throw new ForbiddenException('Team not found');
    }

    if (team.planStatus === PlanStatus.CANCELLED) {
      throw new ForbiddenException(
        'Your subscription has been cancelled. Please renew to continue.',
      );
    }

    if (team.planStatus === PlanStatus.PAST_DUE) {
      throw new ForbiddenException(
        'Your payment is past due. Please update your billing info.',
      );
    }

    return true;
  }
}

/**
 * Guard that checks the team hasn't exceeded their source limit before creating a new source.
 */
@Injectable()
export class SourceLimitGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const teamId = request.body?.teamId ?? request.query?.teamId;

    if (!teamId) {
      throw new ForbiddenException('Missing teamId');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { plan: true },
    });

    if (!team) {
      throw new ForbiddenException('Team not found');
    }

    const limits = PLAN_LIMITS[team.plan];
    const currentCount = await this.prisma.apiSource.count({ where: { teamId } });

    if (currentCount >= limits.maxSources) {
      const nextPlan = team.plan === PlanTier.FREE_TRIAL ? 'Starter' : 'Pro';
      throw new ForbiddenException(
        `You've reached the limit of ${limits.maxSources} API sources on your current plan. Upgrade to ${nextPlan} to monitor more APIs.`,
      );
    }

    return true;
  }
}
