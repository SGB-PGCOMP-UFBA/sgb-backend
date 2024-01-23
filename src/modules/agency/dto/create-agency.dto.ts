import { IsString, MaxLength } from 'class-validator'

export class CreateAgencyDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsString()
  @MaxLength(255)
  readonly description: string
}
