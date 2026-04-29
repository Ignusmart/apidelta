/**
 * Smoke test for GithubTransport. Exercises the request shape we send to
 * GitHub's REST API without actually calling api.github.com — we stub
 * `fetch` in-process and assert on the captured request.
 *
 * Run: pnpm exec tsx scripts/smoke-github.ts
 */
import { GithubTransport } from '../src/modules/alerts/transports/github.transport';

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

async function main(): Promise<void> {
  let captured: CapturedRequest | null = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    const headerInput = init?.headers;
    if (headerInput && typeof headerInput === 'object' && !Array.isArray(headerInput)) {
      for (const [k, v] of Object.entries(headerInput as Record<string, string>)) {
        headers[k] = v;
      }
    }
    captured = {
      url: typeof input === 'string' ? input : input.toString(),
      method: init?.method ?? 'GET',
      headers,
      body: init?.body ? JSON.parse(init.body as string) : null,
    };
    return new Response(
      JSON.stringify({ html_url: 'https://github.com/acme/api/issues/42', number: 42 }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    const transport = new GithubTransport();
    const ok = await transport.send({
      destination: 'acme/api',
      token: 'ghp_test_xxxx',
      labels: ['apidelta', 'breaking-change'],
      alertId: 'alert-cuid-1',
      sourceName: 'Stripe',
      changeType: 'BREAKING',
      severity: 'CRITICAL',
      title: 'Removed deprecated /v1/charges field',
      description: 'The `metadata.legacy_id` field is no longer returned by /v1/charges as of 2026-04-28.',
      affectedEndpoints: ['POST /v1/charges', 'GET /v1/charges/:id'],
      changeDate: '2026-04-28T00:00:00.000Z',
      dashboardUrl: 'https://apidelta.dev/dashboard/changes',
    });

    console.log('send() returned:', ok);
    if (!ok) throw new Error('Transport reported failure on a 201 response');

    if (!captured) throw new Error('No request captured');

    const c = captured as CapturedRequest;

    console.log('\n── Captured request ──');
    console.log('URL:    ', c.url);
    console.log('Method: ', c.method);
    console.log('Headers:', c.headers);
    console.log('Body:   ', JSON.stringify(c.body, null, 2));

    const expectedUrl = 'https://api.github.com/repos/acme/api/issues';
    if (c.url !== expectedUrl) {
      throw new Error(`URL mismatch: expected ${expectedUrl}, got ${c.url}`);
    }
    if (c.method !== 'POST') throw new Error(`Method must be POST, got ${c.method}`);
    if (c.headers.Authorization !== 'Bearer ghp_test_xxxx') {
      throw new Error('Authorization header missing or wrong');
    }
    if (c.headers['X-GitHub-Api-Version'] !== '2022-11-28') {
      throw new Error('X-GitHub-Api-Version header missing');
    }
    const body = c.body as { title: string; body: string; labels: string[] };
    if (!body.title.includes('CRITICAL') || !body.title.includes('Stripe')) {
      throw new Error(`Title shape unexpected: ${body.title}`);
    }
    if (!body.body.includes('alert-cuid-1') || !body.body.includes('BREAKING')) {
      throw new Error('Issue body missing delivery id or change type');
    }
    if (JSON.stringify(body.labels) !== JSON.stringify(['apidelta', 'breaking-change'])) {
      throw new Error(`Labels mismatch: ${JSON.stringify(body.labels)}`);
    }

    console.log('\n✓ All assertions passed.');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err);
  process.exit(1);
});
