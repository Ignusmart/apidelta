import {
  Controller,
  Post,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClassifierService } from './classifier.service';

@Controller('classifier')
export class ClassifierController {
  constructor(private readonly classifierService: ClassifierService) {}

  /**
   * Manually trigger classification on all entries from a specific crawl run.
   * POST /api/classifier/:crawlRunId/classify
   */
  @Post(':crawlRunId/classify')
  @HttpCode(HttpStatus.OK)
  async classifyCrawlRun(@Param('crawlRunId') crawlRunId: string) {
    const classified = await this.classifierService.classifyCrawlRun(crawlRunId);
    return {
      crawlRunId,
      classifiedCount: classified,
    };
  }
}
