import { Injectable, Logger } from '@nestjs/common';

export interface AlertSlackPayload {
  webhookUrl: string;
  sourceName: string;
  changeType: string;
  severity: string;
  title: string;
  description: string;
  affectedEndpoints: string[];
  dashboardUrl: string;
}

@Injectable()
export class SlackTransport {
  private readonly logger = new Logger(SlackTransport.name);

  async send(payload: AlertSlackPayload): Promise<boolean> {
    const body = this.buildMessage(payload);

    if (!payload.webhookUrl || payload.webhookUrl.includes('xxx')) {
      this.logger.log(
        `[DRY RUN] Would send Slack message to ${payload.webhookUrl}: ${payload.title}`,
      );
      return true;
    }

    try {
      const response = await fetch(payload.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook returned ${response.status}`);
      }

      this.logger.log(`Slack notification sent: ${payload.title}`);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send Slack notification: ${msg}`);
      return false;
    }
  }

  private buildMessage(payload: AlertSlackPayload) {
    const severityEmoji: Record<string, string> = {
      CRITICAL: ':rotating_light:',
      HIGH: ':warning:',
      MEDIUM: ':large_yellow_circle:',
      LOW: ':information_source:',
    };

    const emoji = severityEmoji[payload.severity] || ':bell:';
    const endpoints =
      payload.affectedEndpoints.length > 0
        ? payload.affectedEndpoints.map((e) => `\`${e}\``).join(', ')
        : 'No specific endpoints identified';

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${payload.changeType} Change in ${payload.sourceName}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Severity:* ${emoji} ${payload.severity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Type:* ${payload.changeType}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${payload.title}*\n${payload.description}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Affected Endpoints:* ${endpoints}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Full Details',
              },
              url: payload.dashboardUrl,
              style: 'primary',
            },
          ],
        },
        { type: 'divider' },
      ],
    };
  }
}
