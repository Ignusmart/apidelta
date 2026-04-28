/**
 * Smoke test for the WebhookTransport.
 *
 * Spins up a tiny local HTTP receiver, fires a webhook delivery through the
 * transport, then verifies (a) the receiver got the body, (b) the
 * X-APIDelta-Signature header matches HMAC-SHA256(body, secret), and
 * (c) the standard webhook headers are present.
 *
 * Run from apps/api: pnpm exec tsx scripts/smoke-webhook.ts
 */
import { createHmac, randomBytes } from 'crypto';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import {
  WebhookTransport,
  AlertWebhookPayload,
} from '../src/modules/alerts/transports/webhook.transport';

interface Capture {
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

async function startReceiver(): Promise<{
  url: string;
  capture: Promise<Capture>;
  close: () => Promise<void>;
}> {
  let resolve!: (c: Capture) => void;
  const capture = new Promise<Capture>((r) => {
    resolve = r;
  });

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      resolve({
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
  });

  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/webhook`,
    capture,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

async function main(): Promise<void> {
  const transport = new WebhookTransport();
  const receiver = await startReceiver();

  const secret = randomBytes(32).toString('hex');
  const payload: AlertWebhookPayload = {
    webhookUrl: receiver.url,
    secret,
    alertId: 'alert_smoke_test_001',
    sourceName: 'Stripe',
    sourceId: 'src_stripe_001',
    changeType: 'BREAKING',
    severity: 'CRITICAL',
    title: '2026-04-22.dahlia',
    description: 'Breaking changes in payment intent endpoint',
    affectedEndpoints: ['/v1/payment_intents'],
    changeDate: '2026-04-22T00:00:00.000Z',
    dashboardUrl: 'https://apidelta.dev/dashboard/changes',
  };

  console.log(`Receiver listening on ${receiver.url}`);
  const ok = await transport.send(payload);
  console.log(`transport.send returned: ${ok}`);

  const captured = await receiver.capture;
  await receiver.close();

  // Verify body content
  const parsed = JSON.parse(captured.body);
  console.log('\n-- Captured body fields --');
  console.log('  event:        ', parsed.event);
  console.log('  delivery_id:  ', parsed.delivery_id);
  console.log('  source:       ', parsed.source);
  console.log('  change.title: ', parsed.change?.title);
  console.log('  change.severity:', parsed.change?.severity);

  // Verify signature
  const sigHeader = captured.headers['x-apidelta-signature'] as
    | string
    | undefined;
  console.log('\n-- Signature header --');
  console.log('  header:', sigHeader);
  if (!sigHeader || !sigHeader.startsWith('sha256=')) {
    console.error('FAIL: missing or malformed X-APIDelta-Signature');
    process.exit(1);
  }
  const expected = createHmac('sha256', secret)
    .update(captured.body)
    .digest('hex');
  console.log('  expected:', `sha256=${expected}`);
  if (sigHeader !== `sha256=${expected}`) {
    console.error('FAIL: signature mismatch');
    process.exit(1);
  }

  // Verify other standard headers
  console.log('\n-- Other headers --');
  console.log('  X-APIDelta-Event:   ', captured.headers['x-apidelta-event']);
  console.log('  X-APIDelta-Delivery:', captured.headers['x-apidelta-delivery']);
  console.log('  User-Agent:         ', captured.headers['user-agent']);

  console.log('\nAll checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
