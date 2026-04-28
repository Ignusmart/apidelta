import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';

export interface AlertWebhookPayload {
  webhookUrl: string;
  secret: string;
  // Stable identifier so receivers can dedupe replays (uses the Alert.id).
  alertId: string;
  sourceName: string;
  sourceId: string;
  changeType: string;
  severity: string;
  title: string;
  description: string;
  affectedEndpoints: string[];
  changeDate: string | null;
  dashboardUrl: string;
}

@Injectable()
export class WebhookTransport {
  private readonly logger = new Logger(WebhookTransport.name);

  async send(payload: AlertWebhookPayload): Promise<boolean> {
    const body = this.buildBody(payload);
    const bodyString = JSON.stringify(body);
    const signature = this.signBody(bodyString, payload.secret);

    if (!payload.webhookUrl || payload.webhookUrl.includes('example.com')) {
      this.logger.log(
        `[DRY RUN] Would POST webhook to ${payload.webhookUrl}: ${payload.title}`,
      );
      return false;
    }

    try {
      const response = await fetch(payload.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'APIDelta-Webhook/1.0',
          'X-APIDelta-Signature': `sha256=${signature}`,
          'X-APIDelta-Event': 'change.alert',
          'X-APIDelta-Delivery': payload.alertId,
        },
        body: bodyString,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded ${response.status}`);
      }

      this.logger.log(
        `Webhook delivered to ${this.redactUrl(payload.webhookUrl)}: ${payload.title}`,
      );
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Webhook delivery failed to ${this.redactUrl(payload.webhookUrl)}: ${msg}`,
      );
      return false;
    }
  }

  /**
   * Build the JSON body sent to the receiver. Shape is deliberately stable —
   * downstream integrations bind to these field names, so renames or
   * removals are breaking changes.
   */
  private buildBody(payload: AlertWebhookPayload) {
    return {
      event: 'change.alert',
      delivery_id: payload.alertId,
      change: {
        title: payload.title,
        description: payload.description,
        change_type: payload.changeType,
        severity: payload.severity,
        affected_endpoints: payload.affectedEndpoints,
        change_date: payload.changeDate,
      },
      source: {
        id: payload.sourceId,
        name: payload.sourceName,
      },
      dashboard_url: payload.dashboardUrl,
    };
  }

  /** HMAC-SHA256 the body with the rule's secret. Hex-encoded. */
  private signBody(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  /** Strip query string + auth from the URL when logging. */
  private redactUrl(url: string): string {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}${u.pathname}`;
    } catch {
      return '<invalid-url>';
    }
  }
}
