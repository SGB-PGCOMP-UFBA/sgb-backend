import {
  IsString,
  IsEmail,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  IsOptional
} from 'class-validator'
import { constants } from '../../../core/utils/constants'

export class CreateStudentDto {
  @IsString({ message: constants.bodyValidationMessages.NAME_FORMAT_ERROR })
  @MaxLength(80)
  readonly name: string

  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  @Matches(constants.expressions.REGEX_EMAIL, {
    message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR
  })
  readonly email: string

  @IsString()
  readonly password: string

  @IsOptional()
  @IsString({ message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR })
  @Length(14, 14)
  @Matches(constants.expressions.REGEX_TAX_ID, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string

  @IsOptional()
  @IsUrl(
    {},
    { message: constants.bodyValidationMessages.LATTES_LINK_FORMAT_ERROR }
  )
  @MaxLength(80)
  readonly link_to_lattes: string

  @IsOptional()
  @IsString()
  @Length(16, 16, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number: string
}
