import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const KEY_PREFIX = 'ad_live_';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hash a raw key the same way we store it. Used both at create-time
   * (to persist) and at auth-time (to look up by hash).
   */
  static hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  /** Display hint shown alongside each key in the dashboard. */
  private buildPrefixHint(rawKey: string): string {
    // first 12 chars (covers `ad_live_xxxx`) + last 4 — enough to
    // identify which key is which without leaking the secret.
    return `${rawKey.slice(0, 12)}…${rawKey.slice(-4)}`;
  }

  async listKeys(teamId: string) {
    return this.prisma.apiKey.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Mint a fresh API key. The full key is returned ONCE here — callers
   * must surface it to the user immediately. Subsequent reads only see
   * the prefix hint.
   */
  async createKey(opts: { teamId: string; name: string; createdById?: string }) {
    const rawKey = `${KEY_PREFIX}${randomBytes(24).toString('hex')}`;
    const hash = ApiKeysService.hashKey(rawKey);
    const prefix = this.buildPrefixHint(rawKey);

    const created = await this.prisma.apiKey.create({
      data: {
        teamId: opts.teamId,
        name: opts.name.trim() || 'API Key',
        prefix,
        hash,
        createdById: opts.createdById,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    return { ...created, key: rawKey };
  }

  async revokeKey(teamId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, teamId },
    });
    if (!key) throw new NotFoundException(`API key ${keyId} not found`);
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
      select: { id: true, revokedAt: true },
    });
  }

  /**
   * Look up the team for a presented raw key. Returns null on revoked /
   * unknown keys. Side-effect: bumps `lastUsedAt` so users can see which
   * keys are active.
   */
  async authenticateKey(rawKey: string): Promise<{ teamId: string; keyId: string } | null> {
    if (!rawKey?.startsWith(KEY_PREFIX)) return null;
    const hash = ApiKeysService.hashKey(rawKey);
    const row = await this.prisma.apiKey.findUnique({
      where: { hash },
      select: { id: true, teamId: true, revokedAt: true },
    });
    if (!row || row.revokedAt) return null;
    // Fire-and-forget; don't block the request on the timestamp update.
    this.prisma.apiKey
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return { teamId: row.teamId, keyId: row.id };
  }
}
