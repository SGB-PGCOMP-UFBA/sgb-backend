import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator'
import { constants } from '../../../core/utils/constants'

export class CreateAdminDto {
  @IsString()
  readonly name: string

  @IsString({ message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR })
  @Length(14, 14)
  @Matches(constants.expressions.REGEX_TAX_ID, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string

  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsString()
  readonly password: string

  @IsString()
  @IsOptional()
  @Length(16, 16, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number: string
}
