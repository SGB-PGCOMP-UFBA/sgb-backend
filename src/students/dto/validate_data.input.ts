import { IsString, IsEmail, Length, Matches } from 'class-validator'

const REGEX_TAX_ID = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
const REGEX_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
const REGEX__ENROLLMENT_NUMBER = /^[0-9_\.-]{9,9}$/

export class ValidateInput {
  constructor(tax_id: string, enrollment_number: string, email: string) {
    this.tax_id = tax_id
    this.enrollment_number = enrollment_number
    this.email = email
  }

  @IsString()
  @Length(14, 14)
  @Matches(REGEX_TAX_ID, {
    message: 'tax_id must be in the format 000.000.000-00'
  })
  readonly tax_id: string

  @IsString()
  @Length(9, 9)
  @Matches(REGEX__ENROLLMENT_NUMBER, {
    message: 'enrollment_number must be in the format 999999999'
  })
  readonly enrollment_number: string

  @IsEmail()
  @Matches(REGEX_EMAIL, {
    message: 'email must be in the format email@server.com'
  })
  readonly email: string
}
