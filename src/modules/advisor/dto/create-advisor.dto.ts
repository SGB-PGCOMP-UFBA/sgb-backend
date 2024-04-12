import {
  IsString,
  IsEmail,
  Length,
  Matches,
  IsOptional,
  MaxLength
} from 'class-validator'
import { constants } from '../../../core/utils/constants'
import { Transform } from 'class-transformer'

export class CreateAdvisorDto {
  @IsString()
  @MaxLength(80)
  readonly name: string

  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
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
  @Length(14, 14)
  @Matches(constants.expressions.REGEX_TAX_ID, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string | null

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @Length(16, 16, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number: string | null
}
