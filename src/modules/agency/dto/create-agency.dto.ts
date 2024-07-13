import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateAgencyDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsString()
  @MaxLength(255)
  readonly description: string

  @IsOptional()
  @IsNumber()
  readonly masters_degree_awarded_scholarships: number

  @IsOptional()
  @IsNumber()
  readonly doctorate_degree_awarded_scholarships: number
}
