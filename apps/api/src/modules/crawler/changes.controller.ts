import {
  Controller,
  Get,
  Headers,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('changes')
export class ChangesController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get()
  async listChanges(
    @Headers('x-team-id') teamId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
  ) {
    return this.crawlerService.listChanges(teamId, page, pageSize);
  }

  @Get('stats')
  async getStats(
    @Headers('x-team-id') teamId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.crawlerService.getChangesStats(teamId, days);
  }
}
