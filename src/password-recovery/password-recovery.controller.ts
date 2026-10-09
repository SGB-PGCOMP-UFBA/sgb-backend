import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ResetPasswordRequestDto } from '@/password-recovery/dtos/reset-password-request.dto'
import { VerifyRecoveryCodeDto } from '@/password-recovery/dtos/verify-recovery-code.dto'
import { ConfirmPasswordRecoveryDto } from '@/password-recovery/dtos/confirm-password-recovery.dto'
import { PasswordRecoveryService } from './password-recovery.service'

@Controller('v1/passwords/recovery')
export class PasswordRecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}

  @Post()
  async requestCode(@Body() dto: ResetPasswordRequestDto) {
    return this.passwordRecoveryService.sendCode(dto)
  }

  @Post('/verify')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() dto: VerifyRecoveryCodeDto) {
    return this.passwordRecoveryService.verifyCode(dto)
  }

  @Post('/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmReset(@Body() dto: ConfirmPasswordRecoveryDto) {
    return this.passwordRecoveryService.confirmReset(dto)
  }
}
