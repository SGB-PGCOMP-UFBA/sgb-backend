import { IsString, Matches } from 'class-validator'
import { ResetPasswordRequestDto } from '@/password-recovery/dtos/reset-password-request.dto'
import { constants } from '@/common/utils/constants'

export class VerifyRecoveryCodeDto extends ResetPasswordRequestDto {
  @IsString({
    message: constants.bodyValidationMessages.VERIFICATION_CODE_FORMAT_ERROR
  })
  @Matches(/^\d{6}$/, {
    message: constants.bodyValidationMessages.VERIFICATION_CODE_FORMAT_ERROR
  })
  code: string
}
