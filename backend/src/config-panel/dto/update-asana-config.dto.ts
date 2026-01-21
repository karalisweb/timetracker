import { IsString, IsOptional } from 'class-validator';

export class UpdateAsanaConfigDto {
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  defaultProjectId?: string;

  @IsOptional()
  @IsString()
  fieldProjectId?: string;

  @IsOptional()
  @IsString()
  fieldChecklistId?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
