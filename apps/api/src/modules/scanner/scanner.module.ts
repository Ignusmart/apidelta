import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { RepoContentService } from './repo-content.service';
import { TsScannerService } from './ts-scanner.service';

@Module({
  imports: [GithubModule],
  controllers: [ScannerController],
  providers: [ScannerService, RepoContentService, TsScannerService],
  exports: [ScannerService, TsScannerService],
})
export class ScannerModule {}
