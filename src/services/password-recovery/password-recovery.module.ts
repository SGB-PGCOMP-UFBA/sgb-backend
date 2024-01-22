import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { PasswordRecoveryController } from './controller/password-recovery.controller'
import { PasswordRecoveryService } from './service/password-recovery.service'
import { constants } from '../../core/utils/constants'
import { EmailModule } from '../email-sending/email.module'
import { StudentModule } from 'src/modules/student/student.module'

@Module({
  imports: [
    StudentModule,
    EmailModule,
    ConfigModule,
    JwtModule.register({
      secret: constants.jwt.secretKey,
      signOptions: { expiresIn: constants.jwt.expirationTime }
    })
  ],
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService],
  exports: [PasswordRecoveryService]
})
export class PasswordRecoveryModule {}
