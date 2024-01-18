import { IsString } from 'class-validator'

export class CreateAgencyDto {
  constructor(name: string, description: string) {
    this.name = name
    this.description = description
  }

  @IsString() readonly name: string
  @IsString() readonly description: string
}
