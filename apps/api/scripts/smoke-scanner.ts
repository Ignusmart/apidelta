/**
 * Smoke test for the V3.1 ts-morph code scanner.
 *
 * Feeds 5 synthetic TypeScript sources covering the three scanner
 * passes (SDK calls, URL literals, OpenAPI client paths) plus a
 * "should be ignored" file, and asserts the expected surfaces are
 * emitted.
 *
 * Run from apps/api: pnpm exec tsx scripts/smoke-scanner.ts
 */
import { TsScannerService, CatalogMapping, ScanResult } from '../src/modules/scanner/ts-scanner.service';

const MAPPINGS: CatalogMapping[] = [
  {
    slug: 'stripe',
    npmPackages: ['stripe', '@stripe/stripe-js'],
    urlHostnames: ['api.stripe.com', 'js.stripe.com'],
  },
  {
    slug: 'openai',
    npmPackages: ['openai'],
    urlHostnames: ['api.openai.com'],
  },
  {
    slug: 'twilio',
    npmPackages: ['twilio'],
    urlHostnames: ['api.twilio.com'],
  },
  {
    slug: 'anthropic',
    npmPackages: ['@anthropic-ai/sdk'],
    urlHostnames: ['api.anthropic.com'],
  },
];

const FILES = [
  // 1. SDK call via default import + alias chain
  {
    path: 'src/billing.ts',
    content: `
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY!);

export async function createSub(customerId: string) {
  return stripe.subscriptions.create({ customer: customerId, items: [] });
}

export async function refund(chargeId: string) {
  return stripe.refunds.create({ charge: chargeId });
}
`.trimStart(),
  },

  // 2. SDK call via named import
  {
    path: 'src/ai.ts',
    content: `
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });
export const chat = (msgs: any[]) =>
  client.chat.completions.create({ model: 'gpt-4', messages: msgs });
`.trimStart(),
  },

  // 3. URL literal (string + template)
  {
    path: 'src/twilio-fetch.ts',
    content: `
const TWILIO_BASE = 'https://api.twilio.com/2010-04-01/Accounts';

export async function sendSms(to: string, body: string) {
  const url = \`\${TWILIO_BASE}/Messages.json\`;
  const direct = 'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json';
  return fetch(direct, { method: 'POST' });
}
`.trimStart(),
  },

  // 4. OpenAPI fetch client
  {
    path: 'src/internal-api.ts',
    content: `
import createClient from 'openapi-fetch';
const client = createClient({ baseUrl: 'https://internal.example.com' });
export const getUser = (id: string) =>
  client.get('/v1/users/{id}', { params: { path: { id } } });
export const createUser = () =>
  client.post('/v1/users', { body: { name: 'a' } });
`.trimStart(),
  },

  // 5. Should produce nothing — no tracked imports, no tracked hostnames
  {
    path: 'src/utils.ts',
    content: `
export function add(a: number, b: number): number {
  return a + b;
}
const url = 'https://github.com/some/repo';
`.trimStart(),
  },
];

interface Expectation {
  label: string;
  predicate: (results: ScanResult[]) => boolean;
}

const EXPECTATIONS: Expectation[] = [
  {
    label: 'finds stripe.subscriptions.create',
    predicate: (rs) =>
      rs.some(
        (r) =>
          r.catalogSlug === 'stripe' &&
          r.kind === 'SDK_CALL' &&
          r.surface === 'stripe.subscriptions.create' &&
          r.filePath === 'src/billing.ts',
      ),
  },
  {
    label: 'finds stripe.refunds.create on a different line',
    predicate: (rs) =>
      rs.some(
        (r) =>
          r.surface === 'stripe.refunds.create' &&
          r.filePath === 'src/billing.ts' &&
          r.line >= 8,
      ),
  },
  {
    label: 'finds openai.chat.completions.create',
    predicate: (rs) =>
      rs.some(
        (r) =>
          r.catalogSlug === 'openai' &&
          r.kind === 'SDK_CALL' &&
          r.surface === 'openai.chat.completions.create',
      ),
  },
  {
    label: 'finds api.twilio.com hostname literal',
    predicate: (rs) =>
      rs.some(
        (r) =>
          r.catalogSlug === 'twilio' &&
          r.kind === 'HTTP_HOSTNAME' &&
          r.surface === 'api.twilio.com',
      ),
  },
  {
    label: 'extracts a twilio path from a string literal',
    predicate: (rs) =>
      rs.some(
        (r) =>
          r.catalogSlug === 'twilio' &&
          r.kind === 'HTTP_PATH' &&
          r.surface.startsWith('/2010-04-01/Accounts'),
      ),
  },
  {
    label: 'detects openapi-fetch path',
    predicate: (rs) =>
      rs.some(
        (r) =>
          r.kind === 'OPENAPI_PATH' &&
          r.surface === 'GET /v1/users/{id}',
      ),
  },
  {
    label: 'utils.ts contributes zero results',
    predicate: (rs) => rs.every((r) => r.filePath !== 'src/utils.ts'),
  },
];

function main() {
  const scanner = new TsScannerService();
  const results = scanner.scan(FILES, MAPPINGS);

  console.log(`Got ${results.length} raw scan results:`);
  for (const r of results) {
    console.log(`  [${r.catalogSlug}|${r.kind}] ${r.surface} → ${r.filePath}:${r.line}`);
  }
  console.log('');

  let pass = 0;
  let fail = 0;
  for (const exp of EXPECTATIONS) {
    if (exp.predicate(results)) {
      console.log(`  ✓ ${exp.label}`);
      pass++;
    } else {
      console.error(`  ✗ ${exp.label}`);
      fail++;
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
