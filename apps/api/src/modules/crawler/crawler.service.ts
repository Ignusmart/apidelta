import { Injectable, Logger, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { CrawlStatus, ChangeType, Severity } from '@prisma/client';
import { ClassifierService } from '../classifier/classifier.service';
import { AlertsService } from '../alerts/alerts.service';
import * as cheerio from 'cheerio';

export interface ParsedChangelogEntry {
  title: string;
  description: string;
  date: Date | null;
  rawExcerpt: string;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(ClassifierService) private readonly classifier?: ClassifierService,
    @Optional() @Inject(AlertsService) private readonly alertsService?: AlertsService,
  ) {}

  // ── Source CRUD ──────────────────────────────

  async listSources(teamId: string) {
    return this.prisma.apiSource.findMany({
      where: { teamId },
      include: {
        crawlRuns: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            _count: { select: { changes: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSource(id: string) {
    const source = await this.prisma.apiSource.findUnique({
      where: { id },
      include: {
        crawlRuns: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: {
            changes: {
              orderBy: { changeDate: 'desc' },
              take: 20,
            },
          },
        },
      },
    });
    if (!source) throw new NotFoundException(`Source ${id} not found`);
    return source;
  }

  async createSource(dto: CreateSourceDto) {
    return this.prisma.apiSource.create({
      data: {
        name: dto.name,
        url: dto.url,
        sourceType: dto.sourceType,
        teamId: dto.teamId,
        crawlIntervalHours: dto.crawlIntervalHours ?? 6,
      },
    });
  }

  async deleteSource(id: string) {
    const source = await this.prisma.apiSource.findUnique({ where: { id } });
    if (!source) throw new NotFoundException(`Source ${id} not found`);
    return this.prisma.apiSource.delete({ where: { id } });
  }

  // ── Crawl execution ─────────────────────────

  async triggerCrawl(sourceId: string) {
    const source = await this.prisma.apiSource.findUnique({ where: { id: sourceId } });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);

    // Create a CrawlRun record
    const crawlRun = await this.prisma.crawlRun.create({
      data: {
        sourceId,
        status: CrawlStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    const startTime = Date.now();

    try {
      this.logger.log(`Starting crawl for ${source.name} (${source.url})`);

      // Fetch the page
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'DriftWatch/1.0 (changelog-monitor)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse changelog entries
      const entries = this.parseChangelog(html, source.url);
      this.logger.log(`Parsed ${entries.length} changelog entries from ${source.name}`);

      // Store entries as ChangeEntry records
      // For this iteration, we skip AI classification — mark everything as INFO/LOW
      const changeEntries = await Promise.all(
        entries.map((entry) =>
          this.prisma.changeEntry.create({
            data: {
              crawlRunId: crawlRun.id,
              title: entry.title.slice(0, 500),
              description: entry.description.slice(0, 2000),
              rawExcerpt: entry.rawExcerpt.slice(0, 5000),
              changeDate: entry.date,
              changeType: ChangeType.INFO, // AI classifier will set this later
              severity: Severity.LOW,      // AI classifier will set this later
              affectedEndpoints: [],
              isNew: true,
            },
          }),
        ),
      );

      // Update crawl run as completed
      const durationMs = Date.now() - startTime;
      const completedRun = await this.prisma.crawlRun.update({
        where: { id: crawlRun.id },
        data: {
          status: CrawlStatus.COMPLETED,
          completedAt: new Date(),
          durationMs,
          rawHtml: html.slice(0, 500_000), // Cap storage at 500KB
          extractedText: entries.map((e) => `${e.title}: ${e.description}`).join('\n\n').slice(0, 100_000),
        },
        include: { changes: true },
      });

      // Update source lastCrawledAt
      await this.prisma.apiSource.update({
        where: { id: sourceId },
        data: { lastCrawledAt: new Date() },
      });

      this.logger.log(
        `Crawl complete for ${source.name}: ${changeEntries.length} entries in ${durationMs}ms`,
      );

      // Trigger AI classification on the new entries
      if (this.classifier && changeEntries.length > 0) {
        try {
          const classifiedCount = await this.classifier.classifyCrawlRun(crawlRun.id);
          this.logger.log(
            `Classification complete for ${source.name}: ${classifiedCount} entries classified`,
          );
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Classification failed for ${source.name}: ${errMsg}`);
          // Don't fail the crawl — classification is best-effort
        }
      }

      // Evaluate alert rules against the classified changes
      if (this.alertsService && changeEntries.length > 0) {
        try {
          const alertCount = await this.alertsService.evaluateCrawlRun(crawlRun.id);
          this.logger.log(
            `Alert evaluation complete for ${source.name}: ${alertCount} alerts triggered`,
          );
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Alert evaluation failed for ${source.name}: ${errMsg}`);
          // Don't fail the crawl — alerting is best-effort
        }
      }

      return completedRun;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Crawl failed for ${source.name}: ${errorMessage}`);

      return this.prisma.crawlRun.update({
        where: { id: crawlRun.id },
        data: {
          status: CrawlStatus.FAILED,
          completedAt: new Date(),
          durationMs,
          errorMessage,
        },
      });
    }
  }

  // ── HTML changelog parser ────────────────────

  parseChangelog(html: string, url: string): ParsedChangelogEntry[] {
    const $ = cheerio.load(html);
    const entries: ParsedChangelogEntry[] = [];

    // Strategy: try multiple common changelog DOM patterns

    // Pattern 1: Sections with date headings (Stripe, GitHub, many others)
    // Look for article/section elements, or h2/h3 headings followed by content
    const selectors = [
      // Common changelog patterns
      'article',
      '[class*="changelog"] > div, [class*="changelog"] > section',
      '[class*="release"] > div, [class*="release"] > section',
      '[data-testid*="changelog"]',
      '.changelog-entry, .changelog-item',
      '.release-note, .release-entry',
      // Generic section patterns
      'section:has(h2), section:has(h3)',
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length >= 2) {
        // Found a pattern with multiple entries
        elements.each((_, el) => {
          const entry = this.extractEntryFromElement($, $(el));
          if (entry && entry.title.length > 5) {
            entries.push(entry);
          }
        });
        if (entries.length >= 2) {
          return entries.slice(0, 50); // Cap at 50 entries
        }
      }
    }

    // Pattern 2: Heading-based extraction (h2/h3 as entry delimiters)
    if (entries.length < 2) {
      entries.length = 0;
      const headings = $('h2, h3').slice(0, 50);
      headings.each((_, el) => {
        const $heading = $(el);
        const title = $heading.text().trim();
        if (!title || title.length < 3) return;

        // Collect sibling content until next heading
        let description = '';
        let $next = $heading.next();
        let count = 0;
        while ($next.length && !$next.is('h2, h3') && count < 10) {
          description += $next.text().trim() + '\n';
          $next = $next.next();
          count++;
        }

        const date = this.parseDateFromText(title);

        entries.push({
          title: title.slice(0, 500),
          description: description.trim().slice(0, 2000),
          date,
          rawExcerpt: `${title}\n${description.trim()}`.slice(0, 5000),
        });
      });
    }

    return entries.slice(0, 50);
  }

  private extractEntryFromElement(
    $: cheerio.CheerioAPI,
    $el: ReturnType<cheerio.CheerioAPI>,
  ): ParsedChangelogEntry | null {
    // Try to find a heading within this element
    const $heading = $el.find('h1, h2, h3, h4').first();
    const title = $heading.length ? $heading.text().trim() : '';

    // Get date from time element or heading text
    const $time = $el.find('time').first();
    let date: Date | null = null;
    if ($time.length) {
      const datetime = $time.attr('datetime') || $time.text();
      date = this.parseDateFromText(datetime);
    }
    if (!date && title) {
      date = this.parseDateFromText(title);
    }

    // Get description — all paragraph text
    const description = $el
      .find('p, li')
      .map((_, p) => $(p).text().trim())
      .get()
      .join('\n')
      .trim();

    const rawExcerpt = $el.text().trim();

    if (!title && !description) return null;

    return {
      title: title || description.slice(0, 100),
      description: description || title,
      date,
      rawExcerpt: rawExcerpt.slice(0, 5000),
    };
  }

  private parseDateFromText(text: string): Date | null {
    if (!text) return null;

    // Try ISO format first
    const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      const d = new Date(isoMatch[0]);
      if (!isNaN(d.getTime())) return d;
    }

    // Try common date formats: "January 15, 2025", "Jan 15, 2025", "15 Jan 2025"
    const datePatterns = [
      /(\w+ \d{1,2},?\s*\d{4})/,
      /(\d{1,2}\s+\w+\s+\d{4})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const d = new Date(match[1]);
        if (!isNaN(d.getTime())) return d;
      }
    }

    return null;
  }
}
