import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'
import { constants } from '@/common/utils/constants'
import { EmailModule } from '@/email/email.module'
import { StudentModule } from '@/student/student.module'
import { AdvisorModule } from '@/advisor/advisor.module'
import { AdminModule } from '@/admin/admin.module'

@Module({
  imports: [
    AdminModule,
    AdvisorModule,
    StudentModule,
    EmailModule,
    ConfigModule,
    JwtModule.register({
      secret: constants.jwt.SECRET_KEY,
      signOptions: { expiresIn: constants.jwt.EXPIRATION_TIME }
    })
  ],
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService],
  exports: [PasswordRecoveryService]
})
export class PasswordRecoveryModule {}
