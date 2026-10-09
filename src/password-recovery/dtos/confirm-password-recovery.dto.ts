import { VerifyRecoveryCodeDto } from '@/password-recovery/dtos/verify-recovery-code.dto'
import { IsAcceptablePassword } from '@/common/constraints/is-password-acceptable.constraint'
import { IsPasswordMatching } from '@/common/constraints/is-password-matching.constraint'
import { constants } from '@/common/utils/constants'

export class ConfirmPasswordRecoveryDto extends VerifyRecoveryCodeDto {
  @IsAcceptablePassword({
    message: constants.bodyValidationMessages.PASSWORD_IS_NOT_ACCEPTABLE
  })
  new_password: string

  @IsPasswordMatching('new_password', {
    message: constants.bodyValidationMessages.PASSWORD_NOT_MATCHING
  })
  confirm_new_password: string
}
