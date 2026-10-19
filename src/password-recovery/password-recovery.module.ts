import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'
import { EmailModule } from '@/email/email.module'
import { CREDENTIALS_THROTTLER_OPTIONS } from '@/config/credentials-throttler.constant'

@Module({
  imports: [
    EmailModule,
    ThrottlerModule.forRoot(CREDENTIALS_THROTTLER_OPTIONS)
  ],
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService]
})
export class PasswordRecoveryModule {}
