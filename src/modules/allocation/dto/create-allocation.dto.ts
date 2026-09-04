import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateAllocationDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly masters_degree_awarded_scholarships: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly doctorate_degree_awarded_scholarships: number
}
