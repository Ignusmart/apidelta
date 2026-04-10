import {
  Controller,
  Get,
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
    @Query('teamId') teamId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
  ) {
    return this.crawlerService.listChanges(teamId, page, pageSize);
  }
}
