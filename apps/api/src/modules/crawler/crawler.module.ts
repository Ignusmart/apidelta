import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CrawlerService } from './crawler.service';
import { CrawlerProcessor } from './crawler.processor';
import { SourcesController } from './sources.controller';
import { ClassifierModule } from '../classifier/classifier.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [ScheduleModule.forRoot(), ClassifierModule, AlertsModule],
  controllers: [SourcesController],
  providers: [CrawlerService, CrawlerProcessor],
  exports: [CrawlerService],
})
export class CrawlerModule {}
