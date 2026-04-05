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
  UseGuards,
} from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourceLimitGuard } from '../billing/billing.guard';

@Controller('sources')
export class SourcesController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get()
  async listSources(@Query('teamId') teamId: string) {
    return this.crawlerService.listSources(teamId);
  }

  @Post()
  @UseGuards(SourceLimitGuard)
  async createSource(@Body() dto: CreateSourceDto) {
    return this.crawlerService.createSource(dto);
  }

  @Get(':id')
  async getSource(@Param('id') id: string) {
    return this.crawlerService.getSource(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSource(@Param('id') id: string) {
    await this.crawlerService.deleteSource(id);
  }

  @Post(':id/crawl')
  async triggerCrawl(@Param('id') id: string) {
    return this.crawlerService.triggerCrawl(id);
  }
}
