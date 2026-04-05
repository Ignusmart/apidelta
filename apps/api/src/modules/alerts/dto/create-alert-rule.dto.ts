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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
