import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { ApiKeysService } from './api-keys.service';

@Module({
  controllers: [TeamController],
  providers: [TeamService, ApiKeysService],
  exports: [TeamService, ApiKeysService],
})
export class TeamModule {}
