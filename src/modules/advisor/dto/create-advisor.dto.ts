import {
  IsString,
  IsEmail,
  Length,
  Matches,
  IsOptional,
  MaxLength
} from 'class-validator'
import { Transform } from 'class-transformer'
import { constants } from '../../../core/utils/constants'

export class CreateAdvisorDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  @Matches(constants.expressions.REGEX_EMAIL, {
    message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR
  })
  readonly email: string

  @IsOptional()
  @IsString()
  readonly password: string

  @IsOptional()
  @IsString()
  @Matches('^(ACTIVE|INACTIVE)$')
  readonly status: string

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @Length(11, 11)
  @Matches(constants.expressions.REGEX_TAX_ID, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string | null

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @Length(11, 11, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number: string | null
}
