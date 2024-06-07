import { IsString, IsEmail, MaxLength } from 'class-validator'
import { IsPasswordMatching } from '../../../core/constraints/IsPasswordMatchingConstraint'
import { IsStrongPassword } from '../../../core/constraints/IsStrongPasswordConstraint'
import { constants } from '../../../core/utils/constants'

export class UpdateStudentPasswordDto {
  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsStrongPassword({
    message: constants.bodyValidationMessages.PASSWORD_IS_WEAK
  })
  readonly password: string

  @IsPasswordMatching('password', {
    message: constants.bodyValidationMessages.PASSWORD_NOT_MATCHING
  })
  readonly confirm: string
}
