import { Transform, Type } from 'class-transformer'
import {
  IsString,
  IsEmail,
  IsUrl,
  IsDate,
  IsNumber,
  Length,
  Matches,
  IsOptional,
  IsPhoneNumber,
  Contains,
  MinLength,
  MaxLength
} from 'class-validator'

const REGEX_TAX_ID = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/

export class UpdateStudentDTO {
  constructor(
    tax_id: string,
    name: string,
    email: string,
    course: string,
    link_lattes: string,
    advisor_id: number,
    enrollment_date_pgcomp: Date,
    phone_number: string,
    password: string,
    role: string
  ) {
    this.tax_id = tax_id
    this.name = name
    this.email = email
    this.course = course
    this.link_lattes = link_lattes
    this.advisor_id = advisor_id
    this.enrollment_date_pgcomp = enrollment_date_pgcomp
    this.phone_number = phone_number
    this.password = password
    this.role = role
  }

  @IsString()
  @Length(14, 14)
  @Matches(REGEX_TAX_ID, {
    message: 'Tax ID must be in the format 000.000.000-00'
  })
  readonly tax_id: string

  @IsString()
  readonly name: string

  @IsEmail()
  readonly email: string

  @IsString()
  @MinLength(8, {
    message: 'Course only is Doutorado or Mestrado'
  })
  @MaxLength(9, {
    message: 'Course only is Doutorado or Mestrado'
  })
  readonly course: string

  @IsUrl()
  readonly link_lattes: string

  @IsNumber()
  readonly advisor_id: number

  @Type(() => Date)
  @IsDate()
  readonly enrollment_date_pgcomp: Date

  @IsString()
  @IsPhoneNumber('BR')
  readonly phone_number: string

  @IsString()
  password: string

  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @Contains('STUDENT')
  readonly role: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly defense_prediction: Date
}
