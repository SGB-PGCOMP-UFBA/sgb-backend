import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { jwtConstants } from '../auth/constants'
import { AdvisorModule } from '../advisor/advisor.module'
import { EmailModule } from '../email/email.module'
import { StudentsModule } from '../students/students.module'
import { PasswordRecoveryController } from './controller/password-recovery.controller'
import { PasswordRecoveryService } from './service/password-recovery.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    StudentsModule,
    AdvisorModule,
    EmailModule,
    ConfigModule,
    JwtModule.register({
      secret: jwtConstants.secretKey,
      signOptions: { expiresIn: jwtConstants.expirationTime }
    })
  ],
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService],
  exports: [PasswordRecoveryService]
})
export class PasswordRecoveryModule {}
