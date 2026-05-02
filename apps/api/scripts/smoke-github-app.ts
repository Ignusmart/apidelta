/**
 * Smoke test for the GitHub App webhook signature verification path.
 *
 * Stands up a minimal GithubService with a stubbed PrismaService and
 * exercises the security-critical bits without needing a registered App
 * or a database:
 *
 *   1. verifyWebhookSignature accepts a correctly-signed body
 *   2. verifyWebhookSignature rejects a tampered body
 *   3. verifyWebhookSignature rejects a missing header
 *   4. handleWebhook routes installation.created -> upsertInstallation
 *      (asserted via the stubbed Prisma client capturing the call)
 *
 * Run from apps/api: pnpm exec tsx scripts/smoke-github-app.ts
 */
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { GithubService } from '../src/modules/github/github.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { GithubInstallationWebhook } from '../src/modules/github/github.types';

interface PrismaCapture {
  installationUpserts: unknown[];
  repoUpserts: unknown[];
}

function makeStubPrisma(capture: PrismaCapture): PrismaService {
  const stub = {
    githubInstallation: {
      upsert: async (args: unknown) => {
        capture.installationUpserts.push(args);
        return { id: 'install_row_001' };
      },
      findUnique: async () => null,
      updateMany: async () => ({ count: 0 }),
      deleteMany: async () => ({ count: 0 }),
    },
    githubRepo: {
      upsert: async (args: unknown) => {
        capture.repoUpserts.push(args);
        return {};
      },
      updateMany: async () => ({ count: 0 }),
    },
  };
  return stub as unknown as PrismaService;
}

function makeConfig(secret: string): ConfigService {
  return {
    get: (key: string) => (key === 'GITHUB_APP_WEBHOOK_SECRET' ? secret : undefined),
  } as unknown as ConfigService;
}

async function expectThrow(label: string, fn: () => unknown | Promise<unknown>) {
  try {
    await fn();
  } catch {
    console.log(`  ✓ ${label}`);
    return;
  }
  console.error(`  ✗ ${label} — expected throw, got success`);
  process.exit(1);
}

async function main() {
  const secret = 'whsec_smoke_' + 'x'.repeat(32);
  const capture: PrismaCapture = { installationUpserts: [], repoUpserts: [] };
  const service = new GithubService(makeStubPrisma(capture), makeConfig(secret));

  // ── 1. Valid signature passes ──────────────────────────────
  const body = Buffer.from(JSON.stringify({ hello: 'world' }));
  const goodSig = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  service.verifyWebhookSignature(body, goodSig);
  console.log('  ✓ valid signature accepted');

  // ── 2-3. Tampered / missing rejected ───────────────────────
  await expectThrow('tampered body rejected', () => {
    const tampered = Buffer.from(JSON.stringify({ hello: 'mars' }));
    service.verifyWebhookSignature(tampered, goodSig);
  });
  await expectThrow('missing signature header rejected', () => {
    service.verifyWebhookSignature(body, undefined);
  });
  await expectThrow('malformed signature header rejected', () => {
    service.verifyWebhookSignature(body, 'not-the-right-prefix');
  });

  // ── 4. installation.created routes to upsert ───────────────
  // Note: the service defers when the team isn't claimed yet (the OAuth
  // callback hasn't run). To exercise the upsert path here, monkey-patch
  // the team resolver so the service believes the team is known.
  (service as unknown as {
    resolveTeamForInstallation: (id: number) => Promise<string>;
  }).resolveTeamForInstallation = async () => 'team_smoke_001';

  const payload: GithubInstallationWebhook = {
    action: 'created',
    installation: {
      id: 99887766,
      account: { id: 42, login: 'acme', type: 'Organization' },
      repository_selection: 'selected',
      suspended_at: null,
    },
    repositories: [
      { id: 1, name: 'api', full_name: 'acme/api', private: true, default_branch: 'main' },
      { id: 2, name: 'web', full_name: 'acme/web', private: false, default_branch: 'main' },
    ],
    sender: { id: 42, login: 'acme-admin', type: 'User' },
  };

  const result = await service.handleWebhook('installation', payload);
  console.log('  ✓ installation.created handled:', result);

  if (capture.installationUpserts.length !== 1) {
    console.error(
      `  ✗ expected 1 installation upsert, got ${capture.installationUpserts.length}`,
    );
    process.exit(1);
  }
  if (capture.repoUpserts.length !== 2) {
    console.error(`  ✗ expected 2 repo upserts, got ${capture.repoUpserts.length}`);
    process.exit(1);
  }
  console.log(`  ✓ ${capture.installationUpserts.length} installation + ${capture.repoUpserts.length} repo upserts captured`);

  console.log('\nAll checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
