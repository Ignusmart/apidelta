import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangeType, Severity } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

interface ClassifiedEntry {
  title: string;
  isSignal: boolean;
  changeType: 'BREAKING' | 'DEPRECATION' | 'NON_BREAKING' | 'INFO';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedEndpoints: string[];
  summary: string;
}

@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private readonly client: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — classifier will skip classification',
      );
    }
    this.client = new Anthropic({ apiKey: apiKey || '' });
  }

  /**
   * Classify a batch of ChangeEntry records from a crawl run.
   * Updates each entry in the DB with the classification results.
   */
  async classifyCrawlRun(crawlRunId: string): Promise<number> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('Skipping classification — no ANTHROPIC_API_KEY');
      return 0;
    }

    const entries = await this.prisma.changeEntry.findMany({
      where: { crawlRunId, aiSummary: null },
      orderBy: { createdAt: 'asc' },
    });

    if (entries.length === 0) {
      this.logger.log('No entries to classify');
      return 0;
    }

    this.logger.log(
      `Classifying ${entries.length} entries for crawl run ${crawlRunId}`,
    );

    // Process in batches of 20 to stay within token limits
    const BATCH_SIZE = 20;
    let classified = 0;
    let dropped = 0;
    let batchFailures = 0;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      try {
        const results = await this.classifyBatch(batch);
        const { applied, droppedIds } = await this.applyClassifications(
          batch,
          results,
        );
        classified += applied;

        // Hard-delete entries the classifier flagged as noise so they never
        // show up in the feed. They're bad scrapes, not real changes.
        if (droppedIds.length > 0) {
          await this.prisma.changeEntry.deleteMany({
            where: { id: { in: droppedIds } },
          });
          dropped += droppedIds.length;
        }
      } catch (error) {
        batchFailures++;
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Classification failed for batch starting at index ${i}: ${msg}`,
        );
        // Continue with next batch — don't fail the whole run
      }
    }

    if (batchFailures > 0) {
      const totalBatches = Math.ceil(entries.length / BATCH_SIZE);
      this.logger.warn(
        `${batchFailures}/${totalBatches} classification batches failed for crawl run ${crawlRunId}. ` +
        `${entries.length - classified - dropped} entries left unclassified (will retry on next crawl).`,
      );
    }

    this.logger.log(
      `Classified ${classified}/${entries.length} entries for crawl run ${crawlRunId} (dropped ${dropped} as noise)`,
    );
    return classified;
  }

  /**
   * Send a batch of entries to Claude for classification using tool_use
   * for reliable structured output.
   */
  private async classifyBatch(
    entries: Array<{
      id: string;
      title: string;
      description: string;
      changeDate: Date | null;
    }>,
  ): Promise<ClassifiedEntry[]> {
    const entriesForPrompt = entries.map((e, idx) => ({
      index: idx,
      title: e.title.slice(0, 300),
      description: e.description.slice(0, 1000),
      date: e.changeDate?.toISOString().split('T')[0] ?? 'unknown',
    }));

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      system: CLASSIFICATION_SYSTEM_PROMPT,
      tools: [CLASSIFICATION_TOOL],
      tool_choice: { type: 'tool' as const, name: 'submit_classifications' },
      messages: [
        {
          role: 'user',
          content: `Classify these ${entries.length} API changelog entries:\n\n${JSON.stringify(entriesForPrompt, null, 2)}`,
        },
      ],
    });

    // Extract the tool_use block — forced by tool_choice
    const toolUseBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    if (!toolUseBlock) {
      throw new Error('No tool_use block in Claude response');
    }

    const input = toolUseBlock.input as { classifications: ClassifiedEntry[] };

    if (!Array.isArray(input.classifications)) {
      throw new Error(
        'Invalid classification response — missing classifications array',
      );
    }

    return input.classifications;
  }

  /**
   * Apply classification results to the DB entries.
   * Returns the IDs of entries the classifier marked as noise so the caller
   * can delete them.
   */
  private async applyClassifications(
    entries: Array<{ id: string; title: string }>,
    classifications: ClassifiedEntry[],
  ): Promise<{ applied: number; droppedIds: string[] }> {
    const droppedIds: string[] = [];
    const updates: Array<Promise<unknown>> = [];

    // Match by index position — Claude returns in the same order
    entries.forEach((entry, idx) => {
      const classification = classifications[idx];
      if (!classification) return; // Claude didn't return enough results

      // Entry flagged as noise — queue for deletion, don't update
      if (classification.isSignal === false) {
        droppedIds.push(entry.id);
        return;
      }

      updates.push(
        this.prisma.changeEntry.update({
          where: { id: entry.id },
          data: {
            changeType: this.mapChangeType(classification.changeType),
            severity: this.mapSeverity(classification.severity),
            affectedEndpoints: classification.affectedEndpoints ?? [],
            aiSummary: classification.summary || entry.title,
          },
        }),
      );
    });

    await Promise.all(updates);
    return { applied: updates.length, droppedIds };
  }

  private mapChangeType(type: string): ChangeType {
    const map: Record<string, ChangeType> = {
      BREAKING: ChangeType.BREAKING,
      DEPRECATION: ChangeType.DEPRECATION,
      NON_BREAKING: ChangeType.NON_BREAKING,
      INFO: ChangeType.INFO,
    };
    return map[type] ?? ChangeType.INFO;
  }

  private mapSeverity(severity: string): Severity {
    const map: Record<string, Severity> = {
      CRITICAL: Severity.CRITICAL,
      HIGH: Severity.HIGH,
      MEDIUM: Severity.MEDIUM,
      LOW: Severity.LOW,
    };
    return map[severity] ?? Severity.LOW;
  }
}

// ── Prompt & Tool Definition ────────────────────

const CLASSIFICATION_SYSTEM_PROMPT = `You are an API changelog classifier for APIDelta, a tool that monitors third-party API changes.

Your job: given a list of changelog entries from an API provider, classify each one using the submit_classifications tool.

FIRST, decide isSignal for each entry:
- isSignal=false (NOISE — entry will be DROPPED from the feed):
  * Navigation chrome, sidebar menus, filter widgets, pagination captured as content
  * Bare date headers ("Apr 09, 2026", "2024") with no actual content
  * Archive index entries (just a year, just a month)
  * Loading errors, "no results found", "sorry something went wrong"
  * Empty placeholders like "Suggested" with no body
  * Pure marketing blog post announcements with zero technical API content ("Insights for the future of software development")
  * Generic version release announcements with no substantive changes ("v16.2.1-canary.30" with boilerplate)
  * Duplicate/near-duplicate of another entry in the same batch (same change wrapped in a different page chunk)
  * Entries whose description is nearly identical to their title (no new information)
  * Pagination UI captured as content ("An icon of a left arrow 1 2 3...")
- isSignal=true: real changelog entries describing actual API, SDK, platform, or product changes — even small ones

For isSignal=false entries, still provide changeType/severity/summary (they'll be ignored), but use INFO/LOW and a one-word summary like "noise". Do NOT try to rescue noise as INFO — prefer dropping.

Classification rules (only apply to isSignal=true):
- BREAKING: Removes endpoints, changes required parameters, alters response structure in incompatible ways, removes fields, changes authentication. These WILL break existing integrations.
- DEPRECATION: Announces future removal of endpoints/features/fields. Not broken yet but will be. Look for words like "deprecated", "sunset", "end of life", "will be removed".
- NON_BREAKING: New endpoints, new optional parameters, new response fields, performance improvements, bug fixes that don't change behavior. Safe — won't break integrations.
- INFO: Substantive technical announcements or general platform news that developers should know about but don't change API behavior (e.g., new regional availability, new SDK language support, new product launch). NOT marketing filler — that's isSignal=false.

Severity rules:
- CRITICAL: Breaking changes to widely-used endpoints (auth, core CRUD), immediate effect, no migration path mentioned
- HIGH: Breaking changes with migration path, deprecations with short timeline (< 3 months), security-related changes
- MEDIUM: Deprecations with long timeline (3+ months), non-breaking changes to important endpoints, behavior changes
- LOW: New features, documentation updates, minor improvements, informational items

For affectedEndpoints: extract ANY API paths, method names, SDK functions, CLI commands, resource names, or product/service names mentioned. Be thorough — scan the ENTIRE entry text, not just the title. Use the format they appear in (e.g., "/v1/charges", "Charge.create", "conversations.history", "slack run", "AI Gateway"). For entries that mention specific product features or services (e.g., "Browser Rendering", "Workers AI", "Messaging Services"), include those as affected endpoints too. Return empty array ONLY if genuinely no APIs, services, or technical resources are mentioned.

For summary: write a 1-2 sentence technical summary focused on what changed and its impact on integrations.

IMPORTANT: Return classifications in the SAME ORDER as the input entries. One classification per input entry. Be aggressive with isSignal=false — it's better to drop a borderline entry than pollute the feed with noise.`;

const CLASSIFICATION_TOOL: Anthropic.Tool = {
  name: 'submit_classifications',
  description:
    'Submit the classification results for all changelog entries. Must include one classification per input entry, in the same order.',
  input_schema: {
    type: 'object' as const,
    properties: {
      classifications: {
        type: 'array',
        description: 'One classification per input changelog entry, in order',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Echo back the original title for matching',
            },
            isSignal: {
              type: 'boolean',
              description:
                'false if the entry is noise (nav chrome, bare date, empty placeholder, marketing filler, duplicate) and should be dropped from the feed. true if it describes a real change worth showing developers. Be aggressive — prefer dropping borderline entries.',
            },
            changeType: {
              type: 'string',
              enum: ['BREAKING', 'DEPRECATION', 'NON_BREAKING', 'INFO'],
              description: 'Classification of the change type',
            },
            severity: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
              description: 'Severity level of the change',
            },
            affectedEndpoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'API paths, methods, or resources affected',
            },
            summary: {
              type: 'string',
              description:
                'Technical summary of the change and its impact (1-2 sentences)',
            },
          },
          required: [
            'title',
            'isSignal',
            'changeType',
            'severity',
            'affectedEndpoints',
            'summary',
          ],
        },
      },
    },
    required: ['classifications'],
  },
};
