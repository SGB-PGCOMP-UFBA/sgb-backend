import { IsString, IsOptional, MaxLength } from 'class-validator'

export class UpdateAgencyDto {
  @IsString()
  @MaxLength(80)
  @IsOptional()
  readonly name: string

  @IsString()
  @MaxLength(255)
  @IsOptional()
  readonly description: string
}
