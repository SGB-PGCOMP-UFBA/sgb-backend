import {
  IsString,
  IsEmail,
  Length,
  MaxLength,
  IsOptional
} from 'class-validator'
import { constants } from '../../../core/utils/constants'
import { IsAcceptablePassword } from '../../../core/constraints/IsPasswordAcceptableConstraint'

export class CreateStudentDto {
  @IsString({ message: constants.bodyValidationMessages.NAME_FORMAT_ERROR })
  @MaxLength(80)
  readonly name: string

  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsAcceptablePassword({
    message: constants.bodyValidationMessages.PASSWORD_IS_NOT_ACCEPTABLE
  })
  readonly password: string

  @IsOptional()
  @MaxLength(80, {
    message: constants.bodyValidationMessages.LATTES_LINK_FORMAT_ERROR
  })
  readonly link_to_lattes: string

  @IsString({ message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR })
  @Length(11, 11, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string

  @IsOptional()
  @IsString()
  @Length(11, 11, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number: string
}
