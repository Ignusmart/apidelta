import {
  Controller,
  Post,
  Get,
  Headers,
  Req,
  Body,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { GithubService } from './github.service';

class ClaimInstallationDto {
  installationId!: number;
  setupAction!: 'install' | 'update' | string;
}

@Controller('github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  /**
   * GitHub App webhook receiver. Must run before body parsing — we
   * verify HMAC over the raw body before anything else touches it.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }
    this.github.verifyWebhookSignature(rawBody, signature);

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Webhook body is not valid JSON');
    }

    const result = await this.github.handleWebhook(event, payload);
    return { ...result, deliveryId };
  }

  /**
   * Called by the web app after GitHub redirects to the install
   * callback URL. The web app holds the user's session and forwards
   * the team ID via the `x-team-id` header it already uses for every
   * other dashboard request.
   */
  @Post('installations/claim')
  async claim(
    @Headers('x-team-id') teamId: string,
    @Body() dto: ClaimInstallationDto,
  ) {
    if (!teamId) throw new BadRequestException('Missing x-team-id header');
    return this.github.claimInstallation({
      teamId,
      installationId: dto.installationId,
      setupAction: dto.setupAction,
    });
  }

  @Get('installations')
  async listInstallations(@Headers('x-team-id') teamId: string) {
    if (!teamId) throw new BadRequestException('Missing x-team-id header');
    return this.github.listInstallationsForTeam(teamId);
  }
}
