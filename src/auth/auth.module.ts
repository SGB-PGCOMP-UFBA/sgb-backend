import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { PassportModule } from '@nestjs/passport'
import { LocalStrategy } from '@/auth/strategies/local.strategy'
import { JwtModule } from '@nestjs/jwt'
import { UserService } from '@/user/user.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Student } from '@/student/entities/student.entity'
import { AuthController } from './auth.controller'
import { JwtStrategy } from '@/auth/strategies/jwt.strategy'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { Admin } from '@/admin/entities/admin.entity'
import { constants } from '@/common/utils/constants'

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Advisor, Admin]),
    PassportModule,
    JwtModule.register({
      secret: constants.jwt.SECRET_KEY,
      signOptions: { expiresIn: constants.jwt.EXPIRATION_TIME }
    })
  ],
  providers: [AuthService, UserService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
