import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Headers,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { TriageStatus } from '@prisma/client';

@Controller('changes')
export class ChangesController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get()
  async listChanges(
    @Headers('x-team-id') teamId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
    @Query('triageStatus') triageStatus?: string,
  ) {
    return this.crawlerService.listChanges(teamId, page, pageSize, triageStatus as TriageStatus);
  }

  @Get('stats')
  async getStats(
    @Headers('x-team-id') teamId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.crawlerService.getChangesStats(teamId, days);
  }

  @Patch(':id/triage')
  async updateTriage(
    @Headers('x-team-id') teamId: string,
    @Param('id') id: string,
    @Body() body: { status: TriageStatus; assigneeId?: string },
  ) {
    return this.crawlerService.updateTriage(teamId, id, body.status, body.assigneeId);
  }
}
