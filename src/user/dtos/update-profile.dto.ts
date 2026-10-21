import {
  IsString,
  IsEmail,
  Length,
  IsOptional,
  MaxLength
} from 'class-validator'
import { Transform } from 'class-transformer'
import { constants } from '@/common/utils/constants'

/** Edição dos próprios dados; o Lattes só vale para estudantes. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email?: string | null

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @MaxLength(80)
  readonly name?: string | null

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @Length(11, 11, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id?: string | null

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @Length(11, 11, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number?: string | null

  @IsOptional()
  @IsString()
  @Transform((params) => (params.value?.length > 0 ? params.value : null))
  @MaxLength(80, {
    message: constants.bodyValidationMessages.LATTES_LINK_FORMAT_ERROR
  })
  readonly link_to_lattes?: string | null
}
