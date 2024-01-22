import { Module } from '@nestjs/common'
import { AuthService } from './service/auth.service'
import { PassportModule } from '@nestjs/passport'
import { LocalStrategy } from './strategy/local.strategy'
import { JwtModule } from '@nestjs/jwt'
import { UserService } from '../user/services/user.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Student } from '../student/entities/student.entity'
import { AuthController } from './controller/auth.controller'
import { JwtStrategy } from './strategy/jwt.strategy'
import { Advisor } from '../advisor/entities/advisor.entity'
import { Admin } from '../admin/entities/admin.entity'
import { constants } from '../../core/utils/constants'

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Advisor, Admin]),
    PassportModule,
    JwtModule.register({
      secret: constants.jwt.secretKey,
      signOptions: { expiresIn: constants.jwt.expirationTime }
    })
  ],
  providers: [
    AuthService,
    UserService,
    LocalStrategy,
    JwtStrategy
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
