import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf
} from 'class-validator'
import { constants } from '@/common/utils/constants'
import { USER_ROLES, UserRole } from '@/user/user-role.constant'

const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

export class CreateManagedUserDto {
  @IsIn(USER_ROLES)
  readonly role: UserRole

  @Transform(trimToNull)
  @IsString({ message: constants.bodyValidationMessages.NAME_FORMAT_ERROR })
  @MaxLength(80)
  readonly name: string

  @Transform(trimToNull)
  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  /** Obrigatório para estudante, como no autocadastro. */
  @Transform(trimToNull)
  @ValidateIf((dto) => dto.role === 'STUDENT' || dto.tax_id != null)
  @IsString({ message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR })
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
