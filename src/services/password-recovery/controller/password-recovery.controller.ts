import { Body, Controller, Post } from '@nestjs/common'
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto'
import { PasswordRecoveryService } from '../service/password-recovery.service'

@Controller('v1/password-recovery')
export class PasswordRecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}

  @Post('/reset')
  async resetPassword(@Body() dto: ResetPasswordRequestDto) {
    return this.passwordRecoveryService.resetPassword(dto)
  }

  @Post('/request')
  async requestRevoceyPassword(@Body() dto: any) {
    return 
  }
}
