import { IsString, MaxLength } from 'class-validator'

export class CreateAllocationDto {
  @IsString()
  @MaxLength(80)
  readonly name: string
}
