import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength
} from 'class-validator'
import { constants } from '../../../core/utils/constants'
import { Transform } from 'class-transformer'
import { IsAcceptablePassword } from '../../../core/constraints/IsPasswordAcceptableConstraint'

export class CreateAdminDto {
  @IsString()
  readonly name: string

  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsAcceptablePassword()
  readonly password: string

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @Length(11, 11, {
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
