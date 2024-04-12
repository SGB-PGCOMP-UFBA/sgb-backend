import {
  IsString,
  IsEmail,
  Length,
  Matches,
  IsOptional,
  MaxLength
} from 'class-validator'
import { constants } from '../../../core/utils/constants'

export class CreateAdvisorDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsString()
  readonly password: string

  @IsOptional()
  @IsString()
  @Matches('^(ACTIVE|INACTIVE)$')
  readonly status: string

  @IsOptional()
  @IsString({ message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR })
  @Length(14, 14)
  @Matches(constants.expressions.REGEX_TAX_ID, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string

  @IsString()
  @IsOptional()
  @Length(16, 16, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number: string
}
