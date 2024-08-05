import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { PasswordRecoveryController } from './controller/password-recovery.controller'
import { PasswordRecoveryService } from './service/password-recovery.service'
import { constants } from '../../core/utils/constants'
import { EmailModule } from '../email-sending/email.module'
import { StudentModule } from '../../modules/student/student.module'
import { AdvisorModule } from '../../modules/advisor/advisor.module'
import { AdminModule } from '../../modules/admin/admin.module'

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
