import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { ClassifierModule } from './modules/classifier/classifier.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { BillingModule } from './modules/billing/billing.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    CrawlerModule,
    ClassifierModule,
    AlertsModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
