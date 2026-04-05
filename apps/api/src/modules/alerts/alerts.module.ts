import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { EmailTransport } from './transports/email.transport';
import { SlackTransport } from './transports/slack.transport';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, EmailTransport, SlackTransport],
  exports: [AlertsService],
})
export class AlertsModule {}
