import { IsString, IsEmail, MaxLength } from 'class-validator'
import { IsPasswordMatching } from '@/common/constraints/is-password-matching.constraint'
import { IsAcceptablePassword } from '@/common/constraints/is-password-acceptable.constraint'
import { constants } from '@/common/utils/constants'

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
