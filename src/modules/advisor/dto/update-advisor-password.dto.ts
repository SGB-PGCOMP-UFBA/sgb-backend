import { IsString, IsEmail, MaxLength } from 'class-validator'
import { IsPasswordMatching } from '../../../core/constraints/IsPasswordMatchingConstraint'
import { IsAcceptablePassword } from '../../../core/constraints/IsPasswordAcceptableConstraint'
import { constants } from '../../../core/utils/constants'

export class UpdateAdvisorPasswordDto {
  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsString()
  readonly current_password: string

  @IsAcceptablePassword({
    message: constants.bodyValidationMessages.PASSWORD_IS_NOT_ACCEPTABLE
  })
  readonly new_password: string

  @IsPasswordMatching('new_password', {
    message: constants.bodyValidationMessages.PASSWORD_NOT_MATCHING
  })
  readonly confirm_new_password: string
}
