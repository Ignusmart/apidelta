import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // ── Alert Rules ─────────────────────────────────

  @Get('rules')
  async listRules(@Headers('x-team-id') teamId: string) {
    return this.alertsService.listRules(teamId);
  }

  @Post('rules')
  async createRule(@Body() dto: CreateAlertRuleDto, @Headers('x-team-id') teamId: string) {
    dto.teamId = teamId;
    return this.alertsService.createRule(dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(@Param('id') id: string) {
    await this.alertsService.deleteRule(id);
  }

  @Post('rules/:id/regenerate-secret')
  async regenerateWebhookSecret(
    @Headers('x-team-id') teamId: string,
    @Param('id') id: string,
  ) {
    return this.alertsService.regenerateWebhookSecret(teamId, id);
  }

  @Post('rules/:id/test')
  @HttpCode(HttpStatus.OK)
  async testRule(
    @Headers('x-team-id') teamId: string,
    @Param('id') id: string,
  ) {
    return this.alertsService.sendTestAlert(teamId, id);
  }

  // ── Unread Count ─────────────────────────────────

  @Get('unread-count')
  async getUnreadCount(@Headers('x-team-id') teamId: string) {
    return this.alertsService.getUnreadCount(teamId);
  }

  // ── Triggered Alerts ────────────────────────────

  @Get()
  async listAlerts(
    @Headers('x-team-id') teamId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.alertsService.listAlerts(teamId, page, pageSize);
  }

  // ── Retry Failed ─────────────────────────────────

  @Post('retry-failed')
  @HttpCode(HttpStatus.OK)
  async retryFailed(@Headers('x-team-id') teamId: string) {
    return this.alertsService.retryFailed(teamId);
  }
}
