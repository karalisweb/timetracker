import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistAssignmentDto {
  @IsUUID()
  checklistTemplateId: string;

  @IsOptional()
  @IsUUID()
  executorUserId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateOrchProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  asanaProjectId?: string;

  @IsOptional()
  @IsObject()
  decisions?: Record<string, boolean>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistAssignmentDto)
  checklists: ChecklistAssignmentDto[];
}
