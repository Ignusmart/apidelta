import { IsString, IsUrl, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { SourceType } from '@prisma/client';

export class CreateSourceDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsEnum(SourceType)
  sourceType: SourceType;

  @IsString()
  teamId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168) // max 1 week
  crawlIntervalHours?: number;
}
