import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface AlertEmailPayload {
  to: string;
  sourceName: string;
  changeType: string;
  severity: string;
  title: string;
  description: string;
  affectedEndpoints: string[];
  dashboardUrl: string;
}

@Injectable()
export class EmailTransport {
  private readonly logger = new Logger(EmailTransport.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 465,
        secure: (port || 465) === 465,
        auth: { user, pass },
      });
      this.logger.log('Email transport configured');
    } else {
      this.logger.warn(
        'SMTP credentials not configured — email alerts will be logged only',
      );
    }
  }

  async send(payload: AlertEmailPayload): Promise<boolean> {
    const subject = `[APIDelta] ${payload.severity} ${payload.changeType} change in ${payload.sourceName}`;
    const html = this.buildHtml(payload);

    if (!this.transporter) {
      this.logger.log(
        `[DRY RUN] Would send email to ${payload.to}: ${subject}`,
      );
      this.logger.debug(`[DRY RUN] Body:\n${html}`);
      return true; // Treat as success in dry-run mode
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_USER') || 'alerts@apidelta.dev',
        to: payload.to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${payload.to}: ${subject}`);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${payload.to}: ${msg}`);
      return false;
    }
  }

  private buildHtml(payload: AlertEmailPayload): string {
    const endpoints =
      payload.affectedEndpoints.length > 0
        ? payload.affectedEndpoints.map((e) => `<li><code>${e}</code></li>`).join('')
        : '<li>No specific endpoints identified</li>';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-left: 4px solid ${this.severityColor(payload.severity)}; padding-left: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 4px 0; color: #1a1a1a;">${payload.changeType} Change in ${payload.sourceName}</h2>
    <p style="margin: 0; color: #666; font-size: 14px;">Severity: <strong style="color: ${this.severityColor(payload.severity)}">${payload.severity}</strong></p>
  </div>

  <h3 style="margin: 0 0 8px 0;">${payload.title}</h3>
  <p style="color: #333; line-height: 1.5;">${payload.description}</p>

  <h4 style="margin: 16px 0 8px 0;">Affected Endpoints</h4>
  <ul style="padding-left: 20px;">${endpoints}</ul>

  <div style="margin-top: 24px;">
    <a href="${payload.dashboardUrl}" style="display: inline-block; padding: 10px 20px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px;">View Full Details in Dashboard</a>
  </div>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
  <p style="font-size: 12px; color: #999;">APIDelta — API dependency change monitor</p>
</body>
</html>`;
  }

  private severityColor(severity: string): string {
    const colors: Record<string, string> = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#ca8a04',
      LOW: '#16a34a',
    };
    return colors[severity] || '#666';
  }
}
