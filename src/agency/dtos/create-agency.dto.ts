import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateAgencyDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsString()
  @MaxLength(255)
  readonly description: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly masters_degree_awarded_scholarships: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly doctorate_degree_awarded_scholarships: number
}
