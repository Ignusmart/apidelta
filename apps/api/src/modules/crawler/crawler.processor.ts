import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CrawlerService } from './crawler.service';

/**
 * Simple cron-based crawl scheduler.
 * Uses @nestjs/schedule instead of Bull+Redis to avoid a Redis dependency for MVP.
 * Bull queue can be layered in later when Redis is available.
 */
@Injectable()
export class CrawlerProcessor {
  private readonly logger = new Logger(CrawlerProcessor.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawlerService: CrawlerService,
  ) {}

  /**
   * Every hour, check which sources are due for a crawl and trigger them.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledCrawls() {
    if (this.isRunning) {
      this.logger.warn('Previous crawl cycle still running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();

      // Find active sources that are due for a crawl
      const sources = await this.prisma.apiSource.findMany({
        where: {
          isActive: true,
          OR: [
            { lastCrawledAt: null }, // Never crawled
            {
              // lastCrawledAt + crawlIntervalHours < now
              // We can't do interval arithmetic in Prisma easily,
              // so fetch all active sources and filter in code.
            },
          ],
        },
      });

      const dueSources = sources.filter((source) => {
        if (!source.lastCrawledAt) return true;
        const nextCrawlAt = new Date(
          source.lastCrawledAt.getTime() + source.crawlIntervalHours * 60 * 60 * 1000,
        );
        return nextCrawlAt <= now;
      });

      this.logger.log(`Found ${dueSources.length} sources due for crawl`);

      // Process sequentially to be gentle on external servers
      for (const source of dueSources) {
        try {
          await this.crawlerService.triggerCrawl(source.id);
        } catch (error) {
          this.logger.error(
            `Scheduled crawl failed for ${source.name}: ${error instanceof Error ? error.message : error}`,
          );
        }
        // Small delay between crawls to avoid being aggressive
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } finally {
      this.isRunning = false;
    }
  }
}
