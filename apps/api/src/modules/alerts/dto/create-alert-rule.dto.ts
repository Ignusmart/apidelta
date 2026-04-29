import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { AlertChannel, Severity } from '@prisma/client';

export class CreateAlertRuleDto {
  @IsString()
  teamId: string;

  @IsString()
  name: string;

  @IsEnum(AlertChannel)
  channel: AlertChannel;

  @IsString()
  destination: string; // Email address or Slack webhook URL

  @IsOptional()
  @IsEnum(Severity)
  minSeverity?: Severity;

  @IsOptional()
  @IsString()
  sourceFilter?: string; // ApiSource ID

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywordFilter?: string[];

  // GitHub channel only — repo PAT (treated as opaque secret) and labels to apply.
  @IsOptional()
  @IsString()
  githubToken?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  githubLabels?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
