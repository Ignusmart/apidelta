import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertChannel, AlertStatus, ChangeType, Severity } from '@prisma/client';
import { EmailTransport, AlertEmailPayload } from './transports/email.transport';
import { SlackTransport, AlertSlackPayload } from './transports/slack.transport';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';

// Severity ranking for threshold comparison
const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const DASHBOARD_BASE_URL = 'https://apidelta.dev';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailTransport: EmailTransport,
    private readonly slackTransport: SlackTransport,
  ) {}

  // ── Alert Rules CRUD ────────────────────────────

  async listRules(teamId: string) {
    return this.prisma.alertRule.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({
      data: {
        teamId: dto.teamId,
        name: dto.name,
        channel: dto.channel,
        destination: dto.destination,
        minSeverity: dto.minSeverity ?? Severity.MEDIUM,
        sourceFilter: dto.sourceFilter ?? null,
        keywordFilter: dto.keywordFilter ?? [],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.alertRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException(`Alert rule ${id} not found`);
    return this.prisma.alertRule.delete({ where: { id } });
  }

  // ── Triggered Alerts List ───────────────────────

  async listAlerts(teamId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [alerts, total] = await Promise.all([
      this.prisma.alert.findMany({
        where: { teamId },
        include: {
          alertRule: { select: { name: true, channel: true, destination: true } },
          changeEntry: {
            select: {
              title: true,
              changeType: true,
              severity: true,
              description: true,
              affectedEndpoints: true,
              crawlRun: {
                select: {
                  source: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.alert.count({ where: { teamId } }),
    ]);

    return {
      alerts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // ── Core Alert Evaluation ───────────────────────

  /**
   * Evaluate all active alert rules against newly classified changes
   * from a specific crawl run. Creates Alert records and sends notifications.
   */
  async evaluateCrawlRun(crawlRunId: string): Promise<number> {
    // Get the crawl run with its source and new change entries
    const crawlRun = await this.prisma.crawlRun.findUnique({
      where: { id: crawlRunId },
      include: {
        source: true,
        changes: {
          where: { isNew: true },
        },
      },
    });

    if (!crawlRun) {
      this.logger.warn(`Crawl run ${crawlRunId} not found`);
      return 0;
    }

    if (crawlRun.changes.length === 0) {
      this.logger.log(`No new changes in crawl run ${crawlRunId}`);
      return 0;
    }

    const teamId = crawlRun.source.teamId;

    // Get all active alert rules for this team
    const rules = await this.prisma.alertRule.findMany({
      where: {
        teamId,
        isActive: true,
      },
    });

    if (rules.length === 0) {
      this.logger.log(`No active alert rules for team ${teamId} — marking entries as processed`);
      await this.markEntriesProcessed(crawlRunId);
      return 0;
    }

    this.logger.log(
      `Evaluating ${rules.length} rules against ${crawlRun.changes.length} changes from ${crawlRun.source.name}`,
    );

    let alertCount = 0;

    for (const change of crawlRun.changes) {
      for (const rule of rules) {
        if (!this.ruleMatches(rule, change, crawlRun.source.id)) {
          continue;
        }

        // Create alert record (skip if duplicate — unique constraint on alertRuleId+changeEntryId)
        let alert;
        try {
          alert = await this.prisma.alert.create({
            data: {
              alertRuleId: rule.id,
              changeEntryId: change.id,
              teamId,
              status: AlertStatus.PENDING,
            },
          });
        } catch (error) {
          // Unique constraint violation — alert already exists for this rule+change pair
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            continue;
          }
          throw error;
        }

        // Send notification
        const success = await this.sendNotification(
          rule,
          change,
          crawlRun.source.name,
        );

        // Update alert status
        await this.prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: success ? AlertStatus.SENT : AlertStatus.FAILED,
            sentAt: success ? new Date() : null,
            errorMessage: success ? null : 'Notification delivery failed',
          },
        });

        alertCount++;
      }
    }

    // Mark all entries from this crawl run as processed
    await this.markEntriesProcessed(crawlRunId);

    this.logger.log(
      `Created ${alertCount} alerts for crawl run ${crawlRunId}`,
    );
    return alertCount;
  }

  /**
   * Mark all entries in a crawl run as no longer new.
   * Called after alert evaluation (or when no rules exist) so entries
   * don't stay isNew=true indefinitely if the source isn't re-crawled.
   */
  private async markEntriesProcessed(crawlRunId: string): Promise<void> {
    await this.prisma.changeEntry.updateMany({
      where: { crawlRunId, isNew: true },
      data: { isNew: false },
    });
  }

  // ── Rule Matching ───────────────────────────────

  private ruleMatches(
    rule: {
      minSeverity: Severity;
      sourceFilter: string | null;
      keywordFilter: string[];
    },
    change: {
      changeType: ChangeType;
      severity: Severity;
      title: string;
      description: string;
    },
    sourceId: string,
  ): boolean {
    // 1. Check severity threshold
    const changeSeverityRank = SEVERITY_RANK[change.severity] ?? 0;
    const minSeverityRank = SEVERITY_RANK[rule.minSeverity] ?? 0;
    if (changeSeverityRank < minSeverityRank) {
      return false;
    }

    // 2. Check source filter
    if (rule.sourceFilter && rule.sourceFilter !== sourceId) {
      return false;
    }

    // 3. Check keyword filter (if any keywords specified, at least one must match)
    if (rule.keywordFilter.length > 0) {
      const text = `${change.title} ${change.description}`.toLowerCase();
      const matched = rule.keywordFilter.some((kw) =>
        text.includes(kw.toLowerCase()),
      );
      if (!matched) {
        return false;
      }
    }

    return true;
  }

  // ── Retry Failed Alerts ─────────────────────────

  async retryFailed(teamId: string): Promise<{ retried: number; succeeded: number }> {
    const failedAlerts = await this.prisma.alert.findMany({
      where: { teamId, status: AlertStatus.FAILED },
      include: {
        alertRule: true,
        changeEntry: {
          include: {
            crawlRun: {
              include: { source: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (failedAlerts.length === 0) {
      this.logger.log(`No failed alerts to retry for team ${teamId}`);
      return { retried: 0, succeeded: 0 };
    }

    this.logger.log(`Retrying ${failedAlerts.length} failed alerts for team ${teamId}`);

    let succeeded = 0;

    for (const alert of failedAlerts) {
      const { alertRule: rule, changeEntry: change } = alert;
      if (!rule || !change) continue;

      const sourceName = change.crawlRun?.source?.name ?? 'Unknown';
      const success = await this.sendNotification(rule, change, sourceName);

      await this.prisma.alert.update({
        where: { id: alert.id },
        data: {
          status: success ? AlertStatus.SENT : AlertStatus.FAILED,
          sentAt: success ? new Date() : null,
          errorMessage: success ? null : 'Notification delivery failed (retry)',
        },
      });

      if (success) succeeded++;
    }

    this.logger.log(`Retry complete: ${succeeded}/${failedAlerts.length} succeeded`);
    return { retried: failedAlerts.length, succeeded };
  }

  // ── Notification Dispatch ───────────────────────

  private async sendNotification(
    rule: { channel: AlertChannel; destination: string },
    change: {
      title: string;
      changeType: ChangeType;
      severity: Severity;
      description: string;
      affectedEndpoints: string[];
    },
    sourceName: string,
  ): Promise<boolean> {
    const dashboardUrl = `${DASHBOARD_BASE_URL}/dashboard/changes`;

    if (rule.channel === AlertChannel.EMAIL) {
      const payload: AlertEmailPayload = {
        to: rule.destination,
        sourceName,
        changeType: change.changeType,
        severity: change.severity,
        title: change.title,
        description: change.description,
        affectedEndpoints: change.affectedEndpoints,
        dashboardUrl,
      };
      return this.emailTransport.send(payload);
    }

    if (rule.channel === AlertChannel.SLACK) {
      const payload: AlertSlackPayload = {
        webhookUrl: rule.destination,
        sourceName,
        changeType: change.changeType,
        severity: change.severity,
        title: change.title,
        description: change.description,
        affectedEndpoints: change.affectedEndpoints,
        dashboardUrl,
      };
      return this.slackTransport.send(payload);
    }

    this.logger.warn(`Unknown alert channel: ${rule.channel}`);
    return false;
  }
}
