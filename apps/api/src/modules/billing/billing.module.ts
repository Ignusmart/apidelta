import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingGuard, SourceLimitGuard } from './billing.guard';

@Module({
  controllers: [BillingController],
  providers: [BillingService, BillingGuard, SourceLimitGuard],
  exports: [BillingService, BillingGuard, SourceLimitGuard],
})
export class BillingModule {}
