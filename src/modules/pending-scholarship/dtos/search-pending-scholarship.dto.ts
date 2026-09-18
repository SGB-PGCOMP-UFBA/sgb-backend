import { IsISO8601, IsOptional, IsString } from 'class-validator'

export class SearchPendingScholarshipDto {
  @IsOptional()
  @IsString()
  readonly student_name?: string

  @IsOptional()
  @IsString()
  readonly tax_id: string

  @IsOptional()
  @IsString()
  readonly enrollment_program?: string

  @IsOptional()
  @IsString()
  readonly agency?: string

  @IsOptional()
  @IsISO8601()
  readonly scholarship_starts_at?: string

  @IsOptional()
  @IsISO8601()
  readonly scholarship_ends_at?: string
}
