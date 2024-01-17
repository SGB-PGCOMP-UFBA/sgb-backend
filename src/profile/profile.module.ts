import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthModule } from '../auth/auth.module'
import { ProfileController } from './controller/profile.controller'

@Module({
  imports: [AuthModule],
  providers: [JwtService],
  controllers: [ProfileController]
})
export class ProfileModule {}
