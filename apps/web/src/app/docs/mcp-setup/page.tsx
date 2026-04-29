import type { Metadata } from 'next';
import Link from 'next/link';
import { Terminal, Bot, Zap, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'MCP Setup — Connect Claude to your APIDelta workspace',
  description:
    'Wire APIDelta into Claude Code, Claude Desktop, or any MCP-compatible client. Ask Claude things like "what changed in Stripe this week?" and let it pull live data from your monitored sources.',
  alternates: { canonical: 'https://apidelta.dev/docs/mcp-setup' },
};

const MCP_URL = 'https://api.apidelta.dev/api/mcp';

export default function McpSetupPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 text-white">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Connect APIDelta to Claude
        </h1>
        <p className="mt-3 text-base text-gray-400">
          APIDelta ships an{' '}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:underline"
          >
            MCP server
          </a>{' '}
          so Claude can answer questions like &quot;what broke in our APIs this week?&quot; with live
          data from your team&apos;s monitored sources — no copy-pasting changelogs.
        </p>
      </header>

      <section className="mt-10 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
            <Zap aria-hidden="true" className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">1. Mint an API key</h2>
            <p className="mt-1 text-sm text-gray-400">
              Go to{' '}
              <Link
                href="/dashboard/settings"
                className="text-violet-400 hover:underline"
              >
                Dashboard → Settings → API Keys
              </Link>{' '}
              and create a key. Copy it once — APIDelta only stores a hash, so you can&apos;t see
              it again.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Terminal aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">2a. Claude Code (HTTP — recommended)</h2>
            <p className="mt-1 text-sm text-gray-400">
              Claude Code supports HTTP MCP transport directly. One command:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950/60 p-4 text-xs text-gray-300">
{`claude mcp add --transport http apidelta ${MCP_URL} \\
  --header "Authorization: Bearer ad_live_..."`}
            </pre>
            <p className="mt-2 text-xs text-gray-600">
              Replace <code className="text-gray-400">ad_live_…</code> with the key you just minted.
              Restart Claude Code, then ask &quot;list my APIDelta sources.&quot;
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Bot aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">2b. Claude Desktop (via mcp-remote)</h2>
            <p className="mt-1 text-sm text-gray-400">
              Claude Desktop reaches HTTP MCP servers via the{' '}
              <a
                href="https://www.npmjs.com/package/mcp-remote"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline"
              >
                mcp-remote
              </a>{' '}
              proxy. Edit{' '}
              <code className="rounded bg-gray-900 px-1.5 py-0.5 text-xs text-gray-400">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>{' '}
              (macOS) or the equivalent on your OS:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950/60 p-4 text-xs text-gray-300">
{`{
  "mcpServers": {
    "apidelta": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${MCP_URL}",
        "--header",
        "Authorization: Bearer ad_live_..."
      ]
    }
  }
}`}
            </pre>
            <p className="mt-2 text-xs text-gray-600">
              Quit and re-launch Claude Desktop. The hammer icon at the bottom of any chat shows
              the available APIDelta tools.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Available tools</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each tool runs scoped to the team that owns the API key. Returns markdown that Claude
          can quote inline.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li
              key={tool.name}
              className="rounded-lg border border-gray-800 bg-gray-900/40 p-4"
            >
              <p className="font-mono text-xs text-violet-400">{tool.name}</p>
              <p className="mt-1 text-sm text-gray-300">{tool.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <h2 className="text-lg font-semibold">Try it</h2>
        <p className="mt-2 text-sm text-gray-400">Once connected, ask Claude:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-400">
          <li>· &quot;What APIs is my team monitoring with APIDelta?&quot;</li>
          <li>· &quot;Show me critical changes from this week.&quot;</li>
          <li>
            · &quot;Search for changes mentioning <em>auth</em> or <em>deprecat</em>.&quot;
          </li>
          <li>· &quot;Did Stripe ship anything breaking recently?&quot;</li>
          <li>· &quot;Browse the APIDelta catalog for AI / ML providers.&quot;</li>
        </ul>
      </section>

      <p className="mt-8 text-xs text-gray-600">
        Endpoint:{' '}
        <code className="rounded bg-gray-900 px-1.5 py-0.5 text-gray-400">{MCP_URL}</code>
        {' · '}
        Protocol: MCP {' '}
        <code className="rounded bg-gray-900 px-1.5 py-0.5 text-gray-400">2024-11-05</code>
        {' (Streamable HTTP) · Auth: '}
        <code className="rounded bg-gray-900 px-1.5 py-0.5 text-gray-400">Authorization: Bearer</code>
      </p>
    </main>
  );
}

const TOOLS = [
  {
    name: 'list_sources',
    description: 'List the API sources your team is monitoring, with status and last-crawled timestamps.',
  },
  {
    name: 'recent_changes',
    description: 'Recent classified changes — filter by severity (CRITICAL+ / HIGH+ / etc.) or source name.',
  },
  {
    name: 'search_changelog_entries',
    description: 'Free-text search across changelog entry titles and descriptions for your team.',
  },
  {
    name: 'get_alert_history',
    description: 'Recent alerts dispatched (or attempted) — useful for auditing what your team was notified about.',
  },
  {
    name: 'list_catalog',
    description: 'Browse APIDelta\'s curated catalog of monitorable APIs by category, tag, or free-text.',
  },
];
