import {
  Controller,
  Post,
  Get,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ScannerService } from './scanner.service';

@Controller('github/repos')
export class ScannerController {
  constructor(private readonly scanner: ScannerService) {}

  /**
   * Trigger a synchronous scan of a connected repo. Returns summary
   * once the scan completes — caller can poll `GET .../usage` for
   * the persisted results. V3.5 will move this onto a queue.
   */
  @Post(':id/scan')
  async scan(
    @Headers('x-team-id') teamId: string,
    @Param('id') githubRepoRowId: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing x-team-id header');
    return this.scanner.scanRepoForTeam(teamId, githubRepoRowId);
  }

  @Get(':id/usage')
  async usage(
    @Headers('x-team-id') teamId: string,
    @Param('id') githubRepoRowId: string,
  ) {
    if (!teamId) throw new BadRequestException('Missing x-team-id header');
    return this.scanner.listUsageForRepo(teamId, githubRepoRowId);
  }
}
