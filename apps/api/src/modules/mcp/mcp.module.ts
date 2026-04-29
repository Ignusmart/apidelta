import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpTools } from './mcp.tools';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [TeamModule],
  controllers: [McpController],
  providers: [McpTools],
})
export class McpModule {}
