import {
  IsString,
  IsEmail,
  Length,
  IsOptional,
  MaxLength,
  IsUrl
} from 'class-validator'
import { Transform } from 'class-transformer'
import { constants } from '../../../core/utils/constants'

export class UpdateStudentDto {
  @IsString()
  readonly current_email: string

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string | null

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @MaxLength(80)
  readonly name: string | null

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

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @IsUrl(
    {},
    { message: constants.bodyValidationMessages.LATTES_LINK_FORMAT_ERROR }
  )
  @MaxLength(80)
  readonly link_to_lattes: string | null
}
