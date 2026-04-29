import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Severity } from '@prisma/client';

/**
 * Tool definitions exposed over MCP. Each tool resolves data scoped to
 * the team identified by the calling API key. Return values are MCP
 * `content` arrays — typically a single text node holding markdown.
 */

export interface McpToolContext {
  teamId: string;
}

export interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolCallResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

@Injectable()
export class McpTools {
  private readonly logger = new Logger(McpTools.name);

  constructor(private readonly prisma: PrismaService) {}

  list(): McpToolDescriptor[] {
    return [
      {
        name: 'list_sources',
        description:
          'List the API sources this team is monitoring with APIDelta. Includes whether each source is active and when it was last crawled.',
        inputSchema: {
          type: 'object',
          properties: {
            activeOnly: {
              type: 'boolean',
              description: 'Only return sources where isActive=true. Default false.',
            },
          },
        },
      },
      {
        name: 'recent_changes',
        description:
          'Recent classified change entries detected by APIDelta\'s crawler for this team. Filter by severity and limit. Returns the most recent matches first.',
        inputSchema: {
          type: 'object',
          properties: {
            severity: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
              description: 'Minimum severity threshold (inclusive). E.g. "HIGH" returns CRITICAL + HIGH.',
            },
            sourceName: {
              type: 'string',
              description: 'Optional case-insensitive substring match against the source name.',
            },
            limit: {
              type: 'number',
              description: 'Max rows to return (default 20, max 100).',
            },
          },
        },
      },
      {
        name: 'search_changelog_entries',
        description:
          'Free-text search across changelog entry titles and descriptions for this team. Useful for "did Stripe change anything about X recently?" queries.',
        inputSchema: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', description: 'Substring query, case-insensitive.' },
            limit: { type: 'number', description: 'Max rows (default 20, max 100).' },
          },
        },
      },
      {
        name: 'get_alert_history',
        description:
          'Recent alerts that were dispatched (or attempted) for this team. Useful for auditing what your team has been notified about.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['SENT', 'FAILED', 'PENDING'],
              description: 'Optional status filter.',
            },
            limit: { type: 'number', description: 'Max rows (default 20, max 100).' },
          },
        },
      },
      {
        name: 'list_catalog',
        description:
          'Browse APIDelta\'s curated catalog of monitorable APIs. Filter by category or free-text. This is the public catalog — same data as https://apidelta.dev/catalog.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Free-text search across name, description, tags.' },
            category: { type: 'string', description: 'Exact category, e.g. "Payments", "AI / ML".' },
            popular: { type: 'boolean', description: 'Only popular entries.' },
          },
        },
      },
    ];
  }

  // ── Dispatcher ─────────────────────────────────

  async call(
    name: string,
    args: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolCallResult> {
    try {
      switch (name) {
        case 'list_sources':
          return this.listSources(args, ctx);
        case 'recent_changes':
          return this.recentChanges(args, ctx);
        case 'search_changelog_entries':
          return this.searchChangelogEntries(args, ctx);
        case 'get_alert_history':
          return this.getAlertHistory(args, ctx);
        case 'list_catalog':
          return this.listCatalog(args);
        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Tool ${name} failed: ${msg}`);
      return { content: [{ type: 'text', text: `Tool failed: ${msg}` }], isError: true };
    }
  }

  // ── Tool implementations ───────────────────────

  private async listSources(args: Record<string, unknown>, ctx: McpToolContext): Promise<McpToolCallResult> {
    const activeOnly = args.activeOnly === true;
    const sources = await this.prisma.apiSource.findMany({
      where: { teamId: ctx.teamId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        url: true,
        sourceType: true,
        isActive: true,
        lastCrawledAt: true,
      },
    });

    if (sources.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No sources configured. Add one at https://apidelta.dev/dashboard/sources or browse the catalog at https://apidelta.dev/catalog.',
          },
        ],
      };
    }

    const lines = [
      `${sources.length} source${sources.length === 1 ? '' : 's'}:`,
      '',
      ...sources.map(
        (s) =>
          `- **${s.name}** (${s.sourceType.toLowerCase()}) — ${s.isActive ? 'active' : 'paused'}, last crawled ${s.lastCrawledAt ? s.lastCrawledAt.toISOString() : 'never'}\n  ${s.url}`,
      ),
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  private async recentChanges(args: Record<string, unknown>, ctx: McpToolContext): Promise<McpToolCallResult> {
    const severityRank: Record<Severity, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const minSeverity = typeof args.severity === 'string' ? (args.severity as Severity) : null;
    const sourceName = typeof args.sourceName === 'string' ? args.sourceName : null;
    const limit = clampLimit(args.limit);

    const allowedSeverities = minSeverity
      ? (Object.keys(severityRank) as Severity[]).filter(
          (s) => severityRank[s] >= severityRank[minSeverity],
        )
      : undefined;

    const rows = await this.prisma.changeEntry.findMany({
      where: {
        crawlRun: {
          source: {
            teamId: ctx.teamId,
            ...(sourceName
              ? { name: { contains: sourceName, mode: 'insensitive' } }
              : {}),
          },
        },
        ...(allowedSeverities ? { severity: { in: allowedSeverities } } : {}),
      },
      orderBy: [{ changeDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        title: true,
        description: true,
        severity: true,
        changeType: true,
        affectedEndpoints: true,
        changeDate: true,
        createdAt: true,
        crawlRun: { select: { source: { select: { name: true } } } },
      },
    });

    if (rows.length === 0) {
      return { content: [{ type: 'text', text: 'No changes match those filters.' }] };
    }

    const lines = [
      `${rows.length} change${rows.length === 1 ? '' : 's'} (most recent first):`,
      '',
      ...rows.map((r) => {
        const date = (r.changeDate ?? r.createdAt).toISOString().split('T')[0];
        const endpoints =
          r.affectedEndpoints.length > 0
            ? `\n  endpoints: ${r.affectedEndpoints.join(', ')}`
            : '';
        return `- [${r.severity}] **${r.crawlRun.source.name}** (${date}) — ${r.title}\n  ${r.description.slice(0, 240)}${r.description.length > 240 ? '…' : ''}${endpoints}`;
      }),
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  private async searchChangelogEntries(
    args: Record<string, unknown>,
    ctx: McpToolContext,
  ): Promise<McpToolCallResult> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) {
      return { content: [{ type: 'text', text: 'Provide a `query` argument.' }], isError: true };
    }
    const limit = clampLimit(args.limit);

    const rows = await this.prisma.changeEntry.findMany({
      where: {
        crawlRun: { source: { teamId: ctx.teamId } },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ changeDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        title: true,
        description: true,
        severity: true,
        changeDate: true,
        createdAt: true,
        crawlRun: { select: { source: { select: { name: true } } } },
      },
    });

    if (rows.length === 0) {
      return { content: [{ type: 'text', text: `No matches for "${query}".` }] };
    }

    const lines = [
      `${rows.length} match${rows.length === 1 ? '' : 'es'} for "${query}":`,
      '',
      ...rows.map((r) => {
        const date = (r.changeDate ?? r.createdAt).toISOString().split('T')[0];
        return `- [${r.severity}] **${r.crawlRun.source.name}** (${date}) — ${r.title}\n  ${r.description.slice(0, 240)}${r.description.length > 240 ? '…' : ''}`;
      }),
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  private async getAlertHistory(args: Record<string, unknown>, ctx: McpToolContext): Promise<McpToolCallResult> {
    const status = typeof args.status === 'string' ? args.status : null;
    const limit = clampLimit(args.limit);

    const rows = await this.prisma.alert.findMany({
      where: {
        teamId: ctx.teamId,
        ...(status === 'SENT' || status === 'FAILED' || status === 'PENDING'
          ? { status }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        status: true,
        sentAt: true,
        errorMessage: true,
        createdAt: true,
        alertRule: { select: { name: true, channel: true, destination: true } },
        changeEntry: {
          select: {
            title: true,
            severity: true,
            crawlRun: { select: { source: { select: { name: true } } } },
          },
        },
      },
    });

    if (rows.length === 0) {
      return { content: [{ type: 'text', text: 'No alert history.' }] };
    }

    const lines = [
      `${rows.length} alert${rows.length === 1 ? '' : 's'} (most recent first):`,
      '',
      ...rows.map((a) => {
        const sent = a.sentAt ? a.sentAt.toISOString().split('T')[0] : 'pending';
        const ruleName = a.alertRule?.name ?? '(unknown rule)';
        const channel = a.alertRule?.channel ?? '?';
        const sourceName = a.changeEntry?.crawlRun.source.name ?? '?';
        const sev = a.changeEntry?.severity ?? '?';
        const title = a.changeEntry?.title ?? '(deleted)';
        const errorSuffix = a.errorMessage ? `\n  error: ${a.errorMessage.slice(0, 200)}` : '';
        return `- [${a.status}] ${sent} — **${sourceName}** [${sev}] ${title}\n  via ${channel}: ${ruleName}${errorSuffix}`;
      }),
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  private async listCatalog(args: Record<string, unknown>): Promise<McpToolCallResult> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const category = typeof args.category === 'string' ? args.category : null;
    const popular = args.popular === true;

    const rows = await this.prisma.catalogEntry.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(popular ? { popular: true } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { has: query.toLowerCase() } },
              ],
            }
          : {}),
      },
      orderBy: [{ featured: 'desc' }, { popular: 'desc' }, { name: 'asc' }],
      take: 50,
      select: {
        slug: true,
        name: true,
        description: true,
        category: true,
        changelogUrl: true,
      },
    });

    if (rows.length === 0) {
      return { content: [{ type: 'text', text: 'No catalog entries match those filters.' }] };
    }

    const lines = [
      `${rows.length} catalog entr${rows.length === 1 ? 'y' : 'ies'}:`,
      '',
      ...rows.map(
        (r) => `- **${r.name}** (${r.category}) — ${r.description}\n  ${r.changelogUrl}\n  https://apidelta.dev/catalog/${r.slug}`,
      ),
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
}

function clampLimit(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value) || 20;
  return Math.max(1, Math.min(100, Math.floor(n)));
}
