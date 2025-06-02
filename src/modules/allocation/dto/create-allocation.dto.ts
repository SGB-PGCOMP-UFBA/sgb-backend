import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator"

export class CreateAllocationDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsOptional()
  @IsNumber()
  readonly masters_degree_awarded_scholarships: number

  @IsOptional()
  @IsNumber()
  readonly doctorate_degree_awarded_scholarships: number
}
