import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PLAN_LIMITS } from '../billing/billing.service';

const INVITE_TTL_DAYS = 14;

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Members ─────────────────────────────────────

  async listMembers(teamId: string) {
    return this.prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        isOwner: true,
        createdAt: true,
      },
      orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
    });
  }

  // ── Invites ─────────────────────────────────────

  /** Pending = not accepted, not revoked, not expired. */
  private pendingFilter() {
    return {
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    };
  }

  async listInvites(teamId: string) {
    return this.prisma.teamInvite.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async createInvite(opts: { teamId: string; email: string; invitedById?: string }) {
    const email = opts.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email address');
    }

    // Plan limit: members + non-expired pending invites < maxMembers
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: opts.teamId },
      select: { plan: true },
    });
    const limits = PLAN_LIMITS[team.plan];

    const [memberCount, pendingCount, existingMember, existingInvite] = await Promise.all([
      this.prisma.user.count({ where: { teamId: opts.teamId } }),
      this.prisma.teamInvite.count({
        where: { teamId: opts.teamId, ...this.pendingFilter() },
      }),
      this.prisma.user.findFirst({
        where: { teamId: opts.teamId, email },
      }),
      this.prisma.teamInvite.findFirst({
        where: { teamId: opts.teamId, email, ...this.pendingFilter() },
      }),
    ]);

    if (existingMember) {
      throw new BadRequestException('That email is already a team member');
    }
    if (existingInvite) {
      throw new BadRequestException('A pending invite already exists for that email');
    }
    if (memberCount + pendingCount >= limits.maxMembers) {
      throw new ForbiddenException(
        `Plan limit reached: ${limits.maxMembers} member${limits.maxMembers === 1 ? '' : 's'} max on the current plan. Revoke a pending invite or upgrade.`,
      );
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    return this.prisma.teamInvite.create({
      data: {
        teamId: opts.teamId,
        email,
        token,
        invitedById: opts.invitedById,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async revokeInvite(teamId: string, inviteId: string) {
    const invite = await this.prisma.teamInvite.findFirst({
      where: { id: inviteId, teamId },
    });
    if (!invite) throw new NotFoundException(`Invite ${inviteId} not found`);
    if (invite.acceptedAt) {
      throw new BadRequestException('Cannot revoke an already-accepted invite');
    }
    return this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
      select: { id: true, revokedAt: true },
    });
  }

  // ── Accept flow ─────────────────────────────────

  /**
   * Returns invite preview for the landing page. No auth required —
   * the token IS the auth — but we redact internal fields. Also signals
   * status (`pending` / `accepted` / `revoked` / `expired`) so the page
   * can render the right message.
   */
  async getInvitePreview(token: string) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        team: { select: { id: true, name: true } },
      },
    });
    if (!invite) throw new NotFoundException('Invite not found');

    const status: 'pending' | 'accepted' | 'revoked' | 'expired' = invite.acceptedAt
      ? 'accepted'
      : invite.revokedAt
        ? 'revoked'
        : invite.expiresAt < new Date()
          ? 'expired'
          : 'pending';

    return {
      email: invite.email,
      teamName: invite.team.name,
      expiresAt: invite.expiresAt,
      status,
    };
  }

  /**
   * Mark an invite as accepted by a specific user. The actual teamId
   * assignment on the User row happens during NextAuth's createUser
   * event for first-time signups; for existing users this method also
   * moves them onto the new team.
   */
  async acceptInvite(opts: { token: string; userId: string }) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { token: opts.token },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.acceptedAt) throw new BadRequestException('Invite already accepted');
    if (invite.revokedAt) throw new BadRequestException('Invite has been revoked');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite expired');

    const user = await this.prisma.user.findUnique({ where: { id: opts.userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invite is for ${invite.email}; you're signed in as ${user.email}`,
      );
    }

    // Re-check plan limit at accept-time — member count may have changed.
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: invite.teamId },
      select: { plan: true },
    });
    const limits = PLAN_LIMITS[team.plan];
    const memberCount = await this.prisma.user.count({ where: { teamId: invite.teamId } });
    if (user.teamId !== invite.teamId && memberCount >= limits.maxMembers) {
      throw new ForbiddenException(
        'Team is at member capacity for the current plan. Ask the owner to upgrade.',
      );
    }

    // Atomic: mark invite accepted, attach user to team, demote them to non-owner.
    return this.prisma.$transaction(async (tx) => {
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date(), acceptedById: user.id },
      });
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { teamId: invite.teamId, isOwner: false },
        select: { id: true, teamId: true, email: true, isOwner: true },
      });
      return { user: updated, teamId: invite.teamId };
    });
  }

  /**
   * NextAuth's createUser hook calls this so a brand-new signup with a
   * pending invite for that email lands on the inviter's team instead
   * of getting a fresh auto-created team.
   *
   * Returns the teamId of the matched invite (so the caller can skip
   * default-team creation), or null if no pending invite was found.
   */
  async claimPendingInviteForNewUser(opts: { userId: string; email: string }) {
    const invite = await this.prisma.teamInvite.findFirst({
      where: { email: opts.email.toLowerCase(), ...this.pendingFilter() },
      orderBy: { createdAt: 'desc' },
    });
    if (!invite) return null;

    await this.prisma.$transaction(async (tx) => {
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date(), acceptedById: opts.userId },
      });
      await tx.user.update({
        where: { id: opts.userId },
        data: { teamId: invite.teamId, isOwner: false },
      });
    });

    this.logger.log(
      `User ${opts.userId} (${opts.email}) joined team ${invite.teamId} via invite ${invite.id}`,
    );
    return { teamId: invite.teamId };
  }
}
