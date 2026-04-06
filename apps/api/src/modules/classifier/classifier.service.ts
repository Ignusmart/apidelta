import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangeType, Severity } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

interface ClassifiedEntry {
  title: string;
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
      where: { crawlRunId },
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

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      try {
        const results = await this.classifyBatch(batch);
        await this.applyClassifications(batch, results);
        classified += batch.length;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Classification failed for batch starting at index ${i}: ${msg}`,
        );
        // Continue with next batch — don't fail the whole run
      }
    }

    this.logger.log(
      `Classified ${classified}/${entries.length} entries for crawl run ${crawlRunId}`,
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
   */
  private async applyClassifications(
    entries: Array<{ id: string; title: string }>,
    classifications: ClassifiedEntry[],
  ): Promise<void> {
    // Match by index position — Claude returns in the same order
    const updates = entries.map((entry, idx) => {
      const classification = classifications[idx];
      if (!classification) {
        return null; // Skip if Claude didn't return enough results
      }

      return this.prisma.changeEntry.update({
        where: { id: entry.id },
        data: {
          changeType: this.mapChangeType(classification.changeType),
          severity: this.mapSeverity(classification.severity),
          affectedEndpoints: classification.affectedEndpoints ?? [],
          description: classification.summary || entry.title,
        },
      });
    });

    await Promise.all(updates.filter(Boolean));
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

Classification rules:
- BREAKING: Removes endpoints, changes required parameters, alters response structure in incompatible ways, removes fields, changes authentication. These WILL break existing integrations.
- DEPRECATION: Announces future removal of endpoints/features/fields. Not broken yet but will be. Look for words like "deprecated", "sunset", "end of life", "will be removed".
- NON_BREAKING: New endpoints, new optional parameters, new response fields, performance improvements, bug fixes that don't change behavior. Safe — won't break integrations.
- INFO: Blog posts, general announcements, documentation updates, marketing content, pricing changes, status updates. Not a technical API change.

Severity rules:
- CRITICAL: Breaking changes to widely-used endpoints (auth, core CRUD), immediate effect, no migration path mentioned
- HIGH: Breaking changes with migration path, deprecations with short timeline (< 3 months), security-related changes
- MEDIUM: Deprecations with long timeline (3+ months), non-breaking changes to important endpoints, behavior changes
- LOW: New features, documentation updates, minor improvements, informational items

For affectedEndpoints: extract any API paths, method names, SDK functions, or resource names mentioned. Use the format they appear in (e.g., "/v1/charges", "Charge.create"). Return empty array if none mentioned.

For summary: write a 1-2 sentence technical summary focused on what changed and its impact on integrations.

IMPORTANT: Return classifications in the SAME ORDER as the input entries. One classification per input entry.`;

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
