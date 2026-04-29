import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { ClassifierModule } from './modules/classifier/classifier.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { BillingModule } from './modules/billing/billing.module';
import { TeamModule } from './modules/team/team.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { McpModule } from './modules/mcp/mcp.module';
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
    TeamModule,
    CatalogModule,
    McpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
