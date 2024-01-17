import { Body, Controller, Post } from '@nestjs/common'
import { PasswordRecoveryRequestDto } from '../ model/password-recovery-request.dto'
import { ResetPasswordRequestDto } from '../ model/reset-password-request.dto'
import { PasswordRecoveryService } from '../service/password-recovery.service'
@Controller('v1/password-recovery')
export class PasswordRecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}
  @Post('/request')
  async requestPasswordRecovery(@Body() dto: PasswordRecoveryRequestDto) {
    return this.passwordRecoveryService.requestPasswordRecovery(dto)
  }

  @Post('/reset')
  async resetPassword(@Body() dto: ResetPasswordRequestDto) {
    return this.passwordRecoveryService.resetPassword(dto)
  }
}
