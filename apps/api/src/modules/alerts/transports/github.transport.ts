import { Injectable, Logger } from '@nestjs/common';

export interface AlertGithubPayload {
  // owner/repo, e.g. "acme/api"
  destination: string;
  // PAT with `repo` scope
  token: string;
  alertId: string;
  sourceName: string;
  changeType: string;
  severity: string;
  title: string;
  description: string;
  affectedEndpoints: string[];
  changeDate: string | null;
  dashboardUrl: string;
  // Optional labels applied to the issue. Empty array → no labels.
  labels: string[];
}

@Injectable()
export class GithubTransport {
  private readonly logger = new Logger(GithubTransport.name);

  async send(payload: AlertGithubPayload): Promise<boolean> {
    const repoMatch = payload.destination.match(/^([^/\s]+)\/([^/\s]+)$/);
    if (!repoMatch) {
      this.logger.error(
        `GitHub destination must be "owner/repo", got: ${payload.destination}`,
      );
      return false;
    }
    const [, owner, repo] = repoMatch;

    const url = `https://api.github.com/repos/${owner}/${repo}/issues`;
    const body = {
      title: this.buildTitle(payload),
      body: this.buildBody(payload),
      labels: payload.labels,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${payload.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'APIDelta-Alerts/1.0',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(
          `GitHub responded ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        );
      }

      const json = (await response.json()) as { html_url?: string };
      this.logger.log(
        `GitHub issue created in ${owner}/${repo}: ${json.html_url ?? '(no url)'}`,
      );
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `GitHub issue creation failed for ${owner}/${repo}: ${msg}`,
      );
      return false;
    }
  }

  /** Title prefix matches Slack/email convention so issues are scannable. */
  private buildTitle(p: AlertGithubPayload): string {
    return `[${p.severity}] ${p.sourceName}: ${p.title}`;
  }

  private buildBody(p: AlertGithubPayload): string {
    const endpoints =
      p.affectedEndpoints.length > 0
        ? `\n\n**Affected endpoints:**\n${p.affectedEndpoints.map((e) => `- \`${e}\``).join('\n')}`
        : '';
    const date = p.changeDate ? `\n\n**Change date:** ${p.changeDate}` : '';
    return [
      `**${p.changeType}** detected by [APIDelta](${p.dashboardUrl}) in **${p.sourceName}**.`,
      '',
      p.description,
      endpoints,
      date,
      '',
      `---`,
      `_Delivery ID: \`${p.alertId}\` — view in [APIDelta dashboard](${p.dashboardUrl})_`,
    ].join('\n');
  }
}
