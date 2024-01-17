import { IsString, IsEmail } from 'class-validator'

export class CreateAdvisorDto {
  constructor(
    tax_id: string,
    name: string,
    email: string,
    phone_number: string,
    password: string,
    role: string
  ) {
    this.tax_id = tax_id
    this.name = name
    this.email = email
    this.phone_number = phone_number
    this.password = password
    this.role = role
  }

  @IsString()
  readonly tax_id: string

  @IsString()
  readonly name: string

  @IsEmail()
  readonly email: string

  @IsString()
  readonly phone_number: string

  @IsString()
  readonly password: string

  @IsString()
  readonly role: string
}
