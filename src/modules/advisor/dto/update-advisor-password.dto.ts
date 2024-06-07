import { IsString, IsEmail, MaxLength } from 'class-validator'
import { IsPasswordMatching } from '../../../core/constraints/IsPasswordMatchingConstraint'
import { IsStrongPassword } from '../../../core/constraints/IsStrongPasswordConstraint'
import { constants } from '../../../core/utils/constants'

export class UpdateAdvisorPasswordDto {
  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsString()
  readonly current_password: string

  @IsStrongPassword({
    message: constants.bodyValidationMessages.PASSWORD_IS_WEAK
  })
  readonly new_password: string

  @IsPasswordMatching('new_password', {
    message: constants.bodyValidationMessages.PASSWORD_NOT_MATCHING
  })
  readonly confirm_new_password: string
}
