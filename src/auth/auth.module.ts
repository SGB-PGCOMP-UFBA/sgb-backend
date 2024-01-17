import { Module } from '@nestjs/common'
import { AuthService } from './service/auth.service'
import { UserModule } from '../user/user.module'
import { PassportModule } from '@nestjs/passport'
import { LocalStrategy } from './strategy/local.strategy'
import { jwtConstants } from './constants'
import { JwtModule } from '@nestjs/jwt'
import { UserService } from '../user/service/user.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentEntity } from '../students/entities/students.entity'
import { AuthController } from './controller/auth.controller'
import { JwtStrategy } from './strategy/jwt.strategy'
import { Advisor } from '../advisor/entities/advisor.entity'
import { AdminModule } from '../admin/admin.module'
import { AdvisorModule } from '../advisor/advisor.module'
import { Admin } from '../admin/entities/admin.entity'
import { AdminService } from '../admin/service/admin.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity, Advisor, Admin]),
    UserModule,
    PassportModule,
    AdminModule,
    AdvisorModule,
    JwtModule.register({
      secret: jwtConstants.secretKey,
      signOptions: { expiresIn: jwtConstants.expirationTime }
    })
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserService,
    AdminService
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
