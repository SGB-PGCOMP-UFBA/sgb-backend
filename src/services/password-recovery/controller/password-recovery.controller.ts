import { Body, Controller, Post } from '@nestjs/common'
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto'
import { PasswordRecoveryService } from '../service/password-recovery.service'

@Controller('v1/passwords')
export class PasswordRecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}

  @Post('/reset')
  async resetPassword(@Body() dto: ResetPasswordRequestDto) {
    return this.passwordRecoveryService.resetPassword(dto)
  }
}
