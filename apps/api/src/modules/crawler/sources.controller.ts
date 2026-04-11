import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourceLimitGuard } from '../billing/billing.guard';

@Controller('sources')
export class SourcesController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get()
  async listSources(@Headers('x-team-id') teamId: string) {
    return this.crawlerService.listSources(teamId);
  }

  @Post()
  @UseGuards(SourceLimitGuard)
  async createSource(@Body() dto: CreateSourceDto, @Headers('x-team-id') teamId: string) {
    dto.teamId = teamId;
    return this.crawlerService.createSource(dto);
  }

  @Get(':id')
  async getSource(@Param('id') id: string) {
    return this.crawlerService.getSource(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSource(@Param('id') id: string, @Headers('x-team-id') teamId: string) {
    const source = await this.crawlerService.getSource(id);
    if (source.teamId !== teamId) throw new ForbiddenException('Source does not belong to your team');
    await this.crawlerService.deleteSource(id);
  }

  @Post(':id/crawl')
  async triggerCrawl(@Param('id') id: string, @Headers('x-team-id') teamId: string) {
    const source = await this.crawlerService.getSource(id);
    if (source.teamId !== teamId) throw new ForbiddenException('Source does not belong to your team');
    return this.crawlerService.triggerCrawl(id);
  }
}
