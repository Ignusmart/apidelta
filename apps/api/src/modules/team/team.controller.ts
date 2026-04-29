import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { ApiKeysService } from './api-keys.service';

class CreateInviteDto {
  email!: string;
  invitedById?: string;
}

class AcceptInviteDto {
  userId!: string;
}

class ClaimPendingInviteDto {
  userId!: string;
  email!: string;
}

class CreateApiKeyDto {
  name!: string;
  createdById?: string;
}

@Controller('team')
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Get('members')
  async listMembers(@Headers('x-team-id') teamId: string) {
    return this.teamService.listMembers(teamId);
  }

  @Get('invites')
  async listInvites(@Headers('x-team-id') teamId: string) {
    return this.teamService.listInvites(teamId);
  }

  @Post('invites')
  async createInvite(
    @Headers('x-team-id') teamId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.teamService.createInvite({
      teamId,
      email: dto.email,
      invitedById: dto.invitedById,
    });
  }

  @Delete('invites/:id')
  @HttpCode(HttpStatus.OK)
  async revokeInvite(
    @Headers('x-team-id') teamId: string,
    @Param('id') id: string,
  ) {
    return this.teamService.revokeInvite(teamId, id);
  }

  // ── Public-by-token endpoints (no x-team-id header) ──

  @Get('invites/by-token/:token')
  async getInvitePreview(@Param('token') token: string) {
    return this.teamService.getInvitePreview(token);
  }

  @Post('invites/by-token/:token/accept')
  async acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto,
  ) {
    return this.teamService.acceptInvite({ token, userId: dto.userId });
  }

  /**
   * Called from NextAuth's createUser event to attach a brand-new user to
   * a pending invite team (instead of giving them a default team).
   */
  @Post('invites/claim-on-signup')
  async claimOnSignup(@Body() dto: ClaimPendingInviteDto) {
    return this.teamService.claimPendingInviteForNewUser({
      userId: dto.userId,
      email: dto.email,
    });
  }

  // ── API Keys (MCP / programmatic access) ─────────

  @Get('api-keys')
  async listApiKeys(@Headers('x-team-id') teamId: string) {
    return this.apiKeysService.listKeys(teamId);
  }

  @Post('api-keys')
  async createApiKey(
    @Headers('x-team-id') teamId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createKey({
      teamId,
      name: dto.name,
      createdById: dto.createdById,
    });
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(
    @Headers('x-team-id') teamId: string,
    @Param('id') id: string,
  ) {
    return this.apiKeysService.revokeKey(teamId, id);
  }
}
