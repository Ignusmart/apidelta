import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // ── Alert Rules ─────────────────────────────────

  @Get('rules')
  async listRules(@Query('teamId') teamId: string) {
    return this.alertsService.listRules(teamId);
  }

  @Post('rules')
  async createRule(@Body() dto: CreateAlertRuleDto) {
    return this.alertsService.createRule(dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(@Param('id') id: string) {
    await this.alertsService.deleteRule(id);
  }

  // ── Triggered Alerts ────────────────────────────

  @Get()
  async listAlerts(
    @Query('teamId') teamId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.alertsService.listAlerts(teamId, page, pageSize);
  }

  // ── Retry Failed ─────────────────────────────────

  @Post('retry-failed')
  @HttpCode(HttpStatus.OK)
  async retryFailed(@Query('teamId') teamId: string) {
    return this.alertsService.retryFailed(teamId);
  }

  // ── Manual trigger (for testing) ────────────────

  @Post('evaluate/:crawlRunId')
  @HttpCode(HttpStatus.OK)
  async evaluateCrawlRun(@Param('crawlRunId') crawlRunId: string) {
    const alertCount = await this.alertsService.evaluateCrawlRun(crawlRunId);
    return { crawlRunId, alertCount };
  }
}
