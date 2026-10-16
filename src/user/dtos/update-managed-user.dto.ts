import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength
} from 'class-validator'
import { constants } from '@/common/utils/constants'

const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

export class UpdateManagedUserDto {
  @Transform(trimToNull)
  @IsOptional()
  @IsString({ message: constants.bodyValidationMessages.NAME_FORMAT_ERROR })
  @MaxLength(80)
  readonly name: string | null

  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string | null

  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @Length(11, 11, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string | null

  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @Length(11, 11, {
    message: constants.bodyValidationMessages.PHONE_FORMAT_ERROR
  })
  readonly phone_number: string | null

  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80, {
    message: constants.bodyValidationMessages.LATTES_LINK_FORMAT_ERROR
  })
  readonly link_to_lattes: string | null
}
