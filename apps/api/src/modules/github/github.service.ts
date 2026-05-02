import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GithubInstallationWebhook,
  GithubInstallationRepositoriesWebhook,
  GithubWebhookRepo,
} from './github.types';

interface InstallationTokenCacheEntry {
  token: string;
  expiresAt: number; // epoch ms
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  // Installation tokens last ~1 hour. Cache by installation ID and
  // refresh when within 60s of expiry.
  private readonly tokenCache = new Map<number, InstallationTokenCacheEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Webhook signature verification ─────────────────────────

  /**
   * Verify GitHub's `X-Hub-Signature-256` header against the raw body.
   * Throws UnauthorizedException on mismatch — never returns false, so
   * callers don't accidentally drop the check.
   */
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined) {
    const secret = this.config.get<string>('GITHUB_APP_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('GitHub App webhook secret not configured');
    }
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      throw new UnauthorizedException('Missing or malformed signature header');
    }

    const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  // ── Webhook event handlers ─────────────────────────────────

  /**
   * Route a verified webhook by event name. We only handle the install
   * lifecycle in V3.0 — push / pull_request handlers come in V3.1.
   */
  async handleWebhook(event: string, payload: unknown) {
    switch (event) {
      case 'installation':
        return this.handleInstallationEvent(
          payload as GithubInstallationWebhook,
        );
      case 'installation_repositories':
        return this.handleInstallationRepositoriesEvent(
          payload as GithubInstallationRepositoriesWebhook,
        );
      case 'ping':
        return { ok: true };
      default:
        // Unhandled events are logged and ignored — GitHub retries are
        // pointless for events we don't care about.
        this.logger.debug(`Ignoring webhook event: ${event}`);
        return { ok: true, ignored: event };
    }
  }

  private async handleInstallationEvent(payload: GithubInstallationWebhook) {
    const { action, installation, repositories } = payload;
    const teamId = await this.resolveTeamForInstallation(installation.id);

    if (action === 'created') {
      if (!teamId) {
        // No team has claimed this install yet via the OAuth callback.
        // GitHub's webhook may arrive before the redirect lands; we
        // accept the event but do nothing — the callback will upsert.
        this.logger.warn(
          `installation.created for installationId=${installation.id} but no team claimed it yet — deferring to callback`,
        );
        return { ok: true, deferred: true };
      }
      await this.upsertInstallation({
        teamId,
        installationId: installation.id,
        accountType: installation.account.type,
        accountLogin: installation.account.login,
        accountId: installation.account.id,
        suspendedAt: installation.suspended_at
          ? new Date(installation.suspended_at)
          : null,
        repos: repositories ?? [],
      });
      return { ok: true, action };
    }

    if (action === 'deleted') {
      await this.prisma.githubInstallation.deleteMany({
        where: { installationId: installation.id },
      });
      this.tokenCache.delete(installation.id);
      return { ok: true, action };
    }

    if (action === 'suspend' || action === 'unsuspend') {
      await this.prisma.githubInstallation.updateMany({
        where: { installationId: installation.id },
        data: {
          suspendedAt:
            action === 'suspend'
              ? installation.suspended_at
                ? new Date(installation.suspended_at)
                : new Date()
              : null,
          lastWebhookAt: new Date(),
        },
      });
      return { ok: true, action };
    }

    return { ok: true, action, ignored: true };
  }

  private async handleInstallationRepositoriesEvent(
    payload: GithubInstallationRepositoriesWebhook,
  ) {
    const installation = await this.prisma.githubInstallation.findUnique({
      where: { installationId: payload.installation.id },
    });
    if (!installation) {
      this.logger.warn(
        `installation_repositories for unknown installationId=${payload.installation.id}`,
      );
      return { ok: true, deferred: true };
    }

    const added = payload.repositories_added ?? [];
    const removed = payload.repositories_removed ?? [];

    for (const repo of added) {
      await this.upsertRepo(installation.id, repo);
    }
    if (removed.length > 0) {
      await this.prisma.githubRepo.updateMany({
        where: {
          installationId: installation.id,
          repoId: { in: removed.map((r) => r.id) },
        },
        data: { removedAt: new Date() },
      });
    }
    await this.prisma.githubInstallation.update({
      where: { id: installation.id },
      data: { lastWebhookAt: new Date() },
    });

    return { ok: true, added: added.length, removed: removed.length };
  }

  // ── Install callback (called from /api/github/installation-callback) ──

  /**
   * Called by the web app's `/api/github/install/callback` after GitHub
   * redirects the user back. Resolves the team from `state` (signed by
   * the web app, opaque to us — we trust the web app forwarded the
   * already-authenticated team), then fetches the installation's repos
   * via the App API and upserts.
   */
  async claimInstallation(params: {
    teamId: string;
    installationId: number;
    setupAction: 'install' | 'update' | string;
  }) {
    const { teamId, installationId } = params;
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const octokit = await this.octokitForInstallation(installationId);
    const { data: installation } =
      await octokit.rest.apps.getInstallation({ installation_id: installationId });

    const account = installation.account as
      | { id: number; login: string; type: 'User' | 'Organization' }
      | null;
    if (!account) {
      throw new BadRequestException('Installation has no account');
    }

    // Fetch the repos the user authorized for this installation. Pages
    // through if there are >100; we'll cap at 1000 to bound work.
    const repos: GithubWebhookRepo[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
        page,
      });
      for (const r of data.repositories) {
        repos.push({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          private: r.private,
          default_branch: r.default_branch,
        });
      }
      if (data.repositories.length < 100) break;
    }

    await this.upsertInstallation({
      teamId,
      installationId,
      accountType: account.type,
      accountLogin: account.login,
      accountId: account.id,
      suspendedAt: installation.suspended_at
        ? new Date(installation.suspended_at)
        : null,
      repos,
    });

    return { ok: true, repoCount: repos.length };
  }

  // ── Read APIs (for the dashboard page) ─────────────────────

  async listInstallationsForTeam(teamId: string) {
    const installations = await this.prisma.githubInstallation.findMany({
      where: { teamId },
      include: {
        repos: {
          where: { removedAt: null },
          orderBy: { fullName: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return installations;
  }

  // ── Internal helpers ───────────────────────────────────────

  private async upsertInstallation(params: {
    teamId: string;
    installationId: number;
    accountType: string;
    accountLogin: string;
    accountId: number;
    suspendedAt: Date | null;
    repos: GithubWebhookRepo[];
  }) {
    const installation = await this.prisma.githubInstallation.upsert({
      where: { installationId: params.installationId },
      create: {
        teamId: params.teamId,
        installationId: params.installationId,
        accountType: params.accountType,
        accountLogin: params.accountLogin,
        accountId: params.accountId,
        suspendedAt: params.suspendedAt,
        lastWebhookAt: new Date(),
      },
      update: {
        teamId: params.teamId,
        accountType: params.accountType,
        accountLogin: params.accountLogin,
        accountId: params.accountId,
        suspendedAt: params.suspendedAt,
        lastWebhookAt: new Date(),
      },
    });

    for (const repo of params.repos) {
      await this.upsertRepo(installation.id, repo);
    }

    return installation;
  }

  private async upsertRepo(installationRowId: string, repo: GithubWebhookRepo) {
    return this.prisma.githubRepo.upsert({
      where: { repoId: repo.id },
      create: {
        installationId: installationRowId,
        repoId: repo.id,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch ?? 'main',
        private: repo.private,
      },
      update: {
        installationId: installationRowId,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch ?? 'main',
        private: repo.private,
        removedAt: null,
      },
    });
  }

  /**
   * Map a GitHub installation ID back to the team that owns it. Returns
   * null if no team has claimed it yet.
   */
  private async resolveTeamForInstallation(
    installationId: number,
  ): Promise<string | null> {
    const row = await this.prisma.githubInstallation.findUnique({
      where: { installationId },
      select: { teamId: true },
    });
    return row?.teamId ?? null;
  }

  /**
   * Mint (or reuse) an installation access token and return an Octokit
   * client bound to it. Tokens are cached until 60s before expiry.
   */
  async octokitForInstallation(installationId: number): Promise<Octokit> {
    const token = await this.installationToken(installationId);
    return new Octokit({ auth: token });
  }

  private async installationToken(installationId: number): Promise<string> {
    const cached = this.tokenCache.get(installationId);
    if (cached && cached.expiresAt - Date.now() > 60_000) {
      return cached.token;
    }

    const appId = this.config.get<string>('GITHUB_APP_ID');
    const privateKey = this.config.get<string>('GITHUB_APP_PRIVATE_KEY');
    if (!appId || !privateKey) {
      throw new BadRequestException(
        'GitHub App credentials not configured (GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY)',
      );
    }

    // The private key is stored in env with literal `\n` escapes for
    // Railway/Vercel single-line compatibility. Restore real newlines
    // before handing to Octokit.
    const auth = createAppAuth({
      appId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    });
    const result = await auth({
      type: 'installation',
      installationId,
    });

    const expiresAt = new Date(result.expiresAt).getTime();
    this.tokenCache.set(installationId, { token: result.token, expiresAt });
    return result.token;
  }
}
