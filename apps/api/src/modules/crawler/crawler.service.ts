import { Injectable, Logger, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { CrawlStatus, ChangeType, Severity } from '@prisma/client';
import { ClassifierService } from '../classifier/classifier.service';
import { AlertsService } from '../alerts/alerts.service';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

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

  // ── Changes ──────────────────────────────────

  async listChanges(teamId: string, page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;
    const where = {
      crawlRun: { source: { teamId } },
    };
    const [changes, total] = await Promise.all([
      this.prisma.changeEntry.findMany({
        where,
        include: {
          crawlRun: {
            select: {
              source: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.changeEntry.count({ where }),
    ]);

    return {
      changes,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

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
          'User-Agent': 'APIDelta/1.0 (changelog-monitor)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse changelog entries
      const rawEntries = this.parseChangelog(html, source.url);
      this.logger.log(`Parsed ${rawEntries.length} raw entries from ${source.name}`);

      // Split mega-entries (e.g. Linear's single release note with 20+ sub-sections)
      const splitEntries = this.splitMegaEntries(rawEntries);
      if (splitEntries.length !== rawEntries.length) {
        this.logger.log(
          `Split ${rawEntries.length} entries into ${splitEntries.length} after mega-entry expansion`,
        );
      }

      // Filter obvious noise (nav chrome, date headers, archive indices) and dedupe
      const entries = this.filterNoiseAndDedupe(splitEntries);
      this.logger.log(
        `Kept ${entries.length}/${rawEntries.length} entries after noise filter`,
      );

      // Store entries as ChangeEntry records, skipping duplicates via content hash
      const changeEntries = [];
      for (const entry of entries) {
        const hash = this.computeContentHash(sourceId, entry.title);

        // Skip if this content was already seen in a previous crawl run
        const existing = await this.prisma.changeEntry.findFirst({
          where: { contentHash: hash },
          select: { id: true },
        });
        if (existing) continue;

        const created = await this.prisma.changeEntry.create({
          data: {
            crawlRunId: crawlRun.id,
            title: entry.title.slice(0, 500),
            description: entry.description.slice(0, 2000),
            rawExcerpt: entry.rawExcerpt.slice(0, 5000),
            changeDate: entry.date,
            changeType: ChangeType.INFO, // AI classifier will set this later
            severity: Severity.LOW,      // AI classifier will set this later
            affectedEndpoints: [],
            contentHash: hash,
            isNew: true,
          },
        });
        changeEntries.push(created);
      }

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

      // Mark entries from previous crawl runs as no longer new
      // so alerts won't re-fire on them in future evaluations
      if (changeEntries.length > 0) {
        await this.prisma.changeEntry.updateMany({
          where: {
            crawlRun: { sourceId },
            NOT: { crawlRunId: crawlRun.id },
            isNew: true,
          },
          data: { isNew: false },
        });
      }

      return completedRun;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Crawl failed for ${source.name}: ${errorMessage}`);

      // Auto-disable source after 5 consecutive failures
      const recentRuns = await this.prisma.crawlRun.findMany({
        where: { sourceId },
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: { status: true },
      });
      if (
        recentRuns.length >= 5 &&
        recentRuns.every((r) => r.status === CrawlStatus.FAILED)
      ) {
        this.logger.warn(
          `Auto-disabling source ${source.name} after 5 consecutive failures`,
        );
        await this.prisma.apiSource.update({
          where: { id: sourceId },
          data: { isActive: false },
        });
      }

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

  // ── Noise filter & dedup ─────────────────────

  /**
   * Drop entries that look like navigation chrome, bare date headers, archive
   * index pages, loading errors, and other scrape artifacts. Also dedupe by
   * normalized title within the run.
   *
   * This is a cheap pre-filter so we don't waste classifier tokens or pollute
   * the feed with obvious garbage. The AI classifier handles the grey area.
   */
  filterNoiseAndDedupe(
    entries: ParsedChangelogEntry[],
  ): ParsedChangelogEntry[] {
    const seenFingerprints = new Set<string>();
    const seenTokenSets: Array<{ tokens: Set<string>; size: number }> = [];
    const kept: ParsedChangelogEntry[] = [];

    for (const entry of entries) {
      if (this.isLikelyNoise(entry)) continue;

      // Layer 1: exact content fingerprint (title + description prefix).
      // Catches pages that render the same item multiple times with
      // identical body text.
      const fingerprint = this.contentFingerprint(entry);
      if (seenFingerprints.has(fingerprint)) continue;
      seenFingerprints.add(fingerprint);

      // Layer 2: token-set Jaccard similarity against previously-kept
      // entries. Catches same-change-different-framing cases (e.g. Twilio's
      // page renders each item twice — once with the headline as title,
      // once with the subtitle as title).
      const tokens = this.contentTokens(entry);
      const isDup = seenTokenSets.some(({ tokens: prev, size: prevSize }) => {
        let intersect = 0;
        for (const t of tokens) if (prev.has(t)) intersect++;
        const union = prevSize + tokens.size - intersect;
        return union > 0 && intersect / union > 0.7;
      });
      if (isDup) continue;
      seenTokenSets.push({ tokens, size: tokens.size });

      kept.push(entry);
    }

    return kept;
  }

  /** SHA-256 content hash for cross-run deduplication.
   *  Uses sourceId + title only (not description) because the classifier
   *  rewrites description, making it unstable across runs. */
  private computeContentHash(sourceId: string, title: string): string {
    const normalized = `${sourceId}:${title}`
      .toLowerCase()
      .replace(/[^\w\s:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return createHash('sha256').update(normalized).digest('hex');
  }

  /** Stable fingerprint for exact-duplicate detection. */
  private contentFingerprint(entry: ParsedChangelogEntry): string {
    const body = `${entry.title} ${entry.description}`
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240);
    return body;
  }

  /** Token set for near-duplicate Jaccard similarity. */
  private contentTokens(entry: ParsedChangelogEntry): Set<string> {
    const STOP = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'to', 'of', 'in', 'on', 'for', 'and', 'or', 'but', 'with', 'by', 'as',
      'at', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'you', 'your',
      'our', 'their', 'from', 'now', 'new', 'can', 'will', 'has', 'have',
      'into', 'about', 'more', 'learn',
    ]);
    return new Set(
      `${entry.title} ${entry.description.slice(0, 400)}`
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 3 && !STOP.has(t)),
    );
  }

  private isLikelyNoise(entry: ParsedChangelogEntry): boolean {
    const title = entry.title.trim();
    const description = entry.description.trim();

    // Empty / too-short title with no description
    if (title.length < 15 && description.length < 40) return true;

    // Title is just a year ("2023", "2024")
    if (/^\d{4}$/.test(title)) return true;

    // Title is just a date header ("Apr 09, 2026", "April 9, 2026", "2026-04-09")
    if (
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{4}$/i.test(
        title,
      )
    )
      return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(title)) return true;

    // Known nav / UI fragment patterns
    const noisePatterns = [
      /^filter\b/i,
      /^filter by/i,
      /^loading\b/i,
      /^error[:\s]/i,
      /^no results/i,
      /^an icon of/i,
      /^view all/i,
      /^choose a tag/i,
      /^sorry, something went wrong/i,
      /^insights for the future/i, // GitHub marketing filler
      /^suggested$/i, // OpenAI sidebar header
      /^read the latest$/i,
      /^contributors?$/i,
      /^assets$/i,
      /^dahlia$/i, // Stripe version placeholder pages
      /^(pre-)?release$/i,
      // GitHub / markdown release-note section labels. These are subheadings
      // inside a release, not standalone entries. The real entry is the
      // parent release (e.g. "v16.2.1-canary.31").
      /^core changes$/i,
      /^misc changes$/i,
      /^breaking changes$/i,
      /^bug fixes$/i,
      /^new features$/i,
      /^credits$/i,
      /^what's changed$/i,
      /^full changelog$/i,
      // Section headers that parsers extract as standalone entries
      /^features$/i,
      /^studio$/i,
      /^stable channel$/i,
      /^rapid channel$/i,
      /^(🛠\s*)?fixes$/i,
      /^availability and pricing/i,
    ];
    if (noisePatterns.some((p) => p.test(title))) return true;

    // Description that's only GitHub release chrome
    if (
      /^(pre-release|latest|verified|this commit was created)/i.test(
        description.slice(0, 60),
      ) &&
      description.length < 200
    )
      return true;

    // Description is essentially a repeat of the title (no new info)
    if (
      description.length > 0 &&
      description.length < title.length * 1.3 &&
      description.toLowerCase().startsWith(title.toLowerCase().slice(0, 30))
    )
      return true;

    // High ratio of single-word lines (nav menus captured as content)
    const lines = description.split(/\s+/).filter(Boolean);
    if (lines.length > 10) {
      const singleTokenRatio =
        description
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && l.split(/\s+/).length === 1).length /
        Math.max(description.split('\n').length, 1);
      if (singleTokenRatio > 0.6) return true;
    }

    return false;
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
          const $el = $(el);

          // Skip wrapper elements that contain multiple same-level headings.
          // A real wrapper (e.g. Twilio's DOM that holds 10 changelog cards)
          // has several h3 siblings — we want to skip it and let the inner
          // children match via the same selector iteration instead.
          //
          // We intentionally only look at headings AT THE SAME LEVEL as the
          // first heading. A single-entry element with sub-sections (e.g.
          // GitHub's Next.js release page: h2 "v16.2.1-canary.31" + several
          // h3 "Core Changes" / "Misc Changes" children) should NOT be
          // treated as a wrapper — its h2 is the real title and the h3s are
          // section labels within one entry.
          const $headings = $el.find('h1, h2, h3, h4');
          const firstHeading = $headings.get(0);
          if (firstHeading) {
            const firstTag = (firstHeading as { tagName?: string }).tagName?.toLowerCase() ?? '';
            const sameLevelCount = $headings.filter(
              (_i, h) =>
                ((h as { tagName?: string }).tagName?.toLowerCase() ?? '') === firstTag,
            ).length;
            if (sameLevelCount > 1) return;
          }

          const entry = this.extractEntryFromElement($, $el);
          // Require a real title AND some body content. Downstream noise
          // filter does the surgical work; this just blocks the empty shells.
          if (
            entry &&
            entry.title.length >= 10 &&
            entry.description.length >= 20
          ) {
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
    let title = $heading.length ? $heading.text().trim() : '';

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
    let description = $el
      .find('p, li')
      .map((_, p) => $(p).text().trim())
      .get()
      .join('\n')
      .trim();

    // Strip trailing category/product tags from title and description.
    // Many changelogs (e.g. Cloudflare) render category badges as child
    // elements inside or adjacent to the heading, producing titles like:
    // "Automatically retry on upstream provider failures on AI Gateway AI Gateway"
    // We detect this by checking if the title ends with a short phrase
    // that also appears earlier in the same title.
    title = this.stripTrailingCategoryTag(title);
    description = this.stripTrailingCategoryTag(description);

    // Build rawExcerpt from the content we actually extracted, not the full
    // descendant text. $el.text() can bleed sibling content when the matched
    // element is a wrapper containing multiple changelog items (seen on
    // Twilio). Reconstructing from title+description keeps it tight.
    const rawExcerpt = [title, description].filter(Boolean).join('\n\n').trim();

    if (!title && !description) return null;

    return {
      title: title || description.slice(0, 100),
      description: description || title,
      date,
      rawExcerpt: rawExcerpt.slice(0, 5000),
    };
  }

  /**
   * Strip trailing category/product tags that some changelogs append.
   * Detects two patterns:
   * 1. Repeated suffix: "Retry failures on AI Gateway AI Gateway" → "Retry failures on AI Gateway"
   * 2. Trailing short tag on newline: "Some title\nWorkers" → "Some title"
   */
  private stripTrailingCategoryTag(text: string): string {
    if (!text) return text;

    // Pattern 1: title ends with a short phrase (1-4 words) that duplicates
    // text already present earlier in the same string.
    // Split on double-space or trailing whitespace to find the candidate tag.
    const words = text.split(/\s+/);
    for (let tagLen = 1; tagLen <= 4 && tagLen < words.length - 2; tagLen++) {
      const candidate = words.slice(-tagLen).join(' ');
      const prefix = words.slice(0, -tagLen).join(' ');
      if (candidate.length >= 2 && prefix.toLowerCase().includes(candidate.toLowerCase())) {
        return prefix.trim();
      }
    }

    // Pattern 2: trailing short line that looks like a product category tag.
    // "Some description text\nWorkers" or "Some text\nAI Gateway"
    const lines = text.split('\n');
    if (lines.length >= 2) {
      const lastLine = lines[lines.length - 1].trim();
      const wordCount = lastLine.split(/\s+/).length;
      if (wordCount <= 4 && lastLine.length <= 40) {
        const rest = lines.slice(0, -1).join('\n');
        if (rest.toLowerCase().includes(lastLine.toLowerCase())) {
          return rest.trim();
        }
      }
    }

    return text;
  }

  /**
   * Split mega-entries that contain multiple distinct changes into separate
   * entries. Detects entries whose description contains multiple headed
   * sections (e.g. Linear publishes one release note with 20+ sub-sections
   * like "Fixes", "Improvements", "API", each with distinct changes).
   *
   * Heuristic: if description has 5+ lines starting with a bold/heading
   * pattern, split into the primary entry (title + first section) plus
   * individual sub-entries for each section heading.
   */
  splitMegaEntries(entries: ParsedChangelogEntry[]): ParsedChangelogEntry[] {
    const result: ParsedChangelogEntry[] = [];

    for (const entry of entries) {
      // Only split entries with substantial description
      if (!entry.description || entry.description.length < 500) {
        result.push(entry);
        continue;
      }

      // Detect section headings in the description:
      // Lines that look like "FixesSome fix description" (Linear's collapsed headings),
      // or "## Section" (markdown), or lines ending with a heading-like pattern
      const lines = entry.description.split('\n');
      const sectionIndices: number[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Match common section patterns in changelog descriptions:
        // - "Fixes" / "Improvements" / "API" as standalone short lines followed by content
        // - Lines that are all-caps short labels
        // - "## Heading" markdown
        if (
          /^#{1,3}\s+/.test(line) ||
          (line.length <= 50 && /^[A-Z][A-Za-z\s&/]+$/.test(line) && i < lines.length - 1)
        ) {
          sectionIndices.push(i);
        }
      }

      // Only split if there are 5+ identifiable sections
      if (sectionIndices.length < 5) {
        result.push(entry);
        continue;
      }

      // Build sub-entries from each section
      for (let s = 0; s < sectionIndices.length; s++) {
        const startIdx = sectionIndices[s];
        const endIdx = s + 1 < sectionIndices.length
          ? sectionIndices[s + 1]
          : lines.length;

        const sectionTitle = lines[startIdx].trim().replace(/^#+\s*/, '');
        const sectionBody = lines
          .slice(startIdx + 1, endIdx)
          .join('\n')
          .trim();

        // Skip empty sections or pure heading-only sections
        if (!sectionBody || sectionBody.length < 20) continue;

        // Combine parent title with section heading for context
        const subTitle = `${entry.title} — ${sectionTitle}`;
        result.push({
          title: subTitle.slice(0, 500),
          description: sectionBody.slice(0, 2000),
          date: entry.date,
          rawExcerpt: `${subTitle}\n\n${sectionBody}`.slice(0, 5000),
        });
      }

      // If we didn't extract any sub-entries, keep the original
      if (result.length === 0 || result[result.length - 1].title === entries[entries.indexOf(entry) - 1]?.title) {
        result.push(entry);
      }
    }

    return result;
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
