/**
 * Smoke test for the MCP server. Mints a temporary API key for an
 * existing team, exercises initialize/tools.list/tools.call against the
 * locally-running API, then revokes the key.
 *
 * Run while `pnpm start` is active in another terminal:
 *
 *   pnpm exec tsx scripts/smoke-mcp.ts [http://localhost:3001/api]
 */
import { PrismaClient } from '@prisma/client';
import { ApiKeysService } from '../src/modules/team/api-keys.service';

const BASE = process.argv[2] ?? 'http://localhost:3001/api';

interface JsonRpcResponse {
  result?: unknown;
  error?: { code: number; message: string };
}

async function rpc(token: string, method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`${BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = (await res.json()) as JsonRpcResponse;
  return { status: res.status, json };
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  let teamId: string | null = null;
  let keyId: string | null = null;
  let rawKey = '';

  try {
    // Pick the first team that exists in the local/Neon DB.
    const team = await prisma.team.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!team) {
      console.log('No teams in DB — skip MCP smoke test (no team to scope to).');
      return;
    }
    teamId = team.id;
    console.log(`Using team ${teamId}`);

    // Mint an API key directly via the service so we don't need an
    // authenticated session for this script.
    const svc = new ApiKeysService(prisma as unknown as never);
    const created = await svc.createKey({ teamId, name: 'smoke-mcp' });
    keyId = created.id;
    rawKey = created.key;
    console.log(`Minted key ${keyId} (${created.prefix})`);

    // ── 1) Sanity: GET /mcp without auth ──
    const info = await fetch(`${BASE}/mcp`).then((r) => r.json());
    console.log('GET /mcp →', info);

    // ── 2) Bad auth ──
    const badAuth = await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ad_live_bogus' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    });
    console.log(`Bad auth status: ${badAuth.status}`);
    if (badAuth.status !== 401) throw new Error('expected 401 on bad key');

    // ── 3) initialize ──
    const init = await rpc(rawKey, 'initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'smoke', version: '0.0.1' },
      capabilities: {},
    });
    console.log('initialize →', JSON.stringify(init.json));
    if (!init.json.result) throw new Error('initialize did not return result');

    // ── 4) tools/list ──
    const tools = await rpc(rawKey, 'tools/list');
    const toolNames = ((tools.json.result as { tools: Array<{ name: string }> }).tools ?? []).map(
      (t) => t.name,
    );
    console.log('tools/list →', toolNames);
    const expected = [
      'list_sources',
      'recent_changes',
      'search_changelog_entries',
      'get_alert_history',
      'list_catalog',
    ];
    for (const name of expected) {
      if (!toolNames.includes(name)) throw new Error(`Missing tool: ${name}`);
    }

    // ── 5) tools/call list_catalog ──
    const cat = await rpc(rawKey, 'tools/call', {
      name: 'list_catalog',
      arguments: { popular: true },
    });
    const text = (cat.json.result as { content: Array<{ text: string }> }).content[0].text;
    console.log(`list_catalog (first 300 chars):\n${text.slice(0, 300)}`);
    if (!text.includes('catalog entr')) throw new Error('list_catalog returned unexpected shape');

    // ── 6) tools/call list_sources ──
    const srcs = await rpc(rawKey, 'tools/call', {
      name: 'list_sources',
      arguments: { activeOnly: true },
    });
    const srcText = (srcs.json.result as { content: Array<{ text: string }> }).content[0].text;
    console.log(`list_sources (first 300 chars):\n${srcText.slice(0, 300)}`);

    console.log('\n✓ All assertions passed.');
  } finally {
    if (keyId) {
      await prisma.apiKey.delete({ where: { id: keyId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err);
  process.exit(1);
});
