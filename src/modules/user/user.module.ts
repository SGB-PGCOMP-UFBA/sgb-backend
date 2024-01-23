import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Admin } from '../admin/entities/admin.entity'
import { Advisor } from '../advisor/entities/advisor.entity'
import { Student } from '../student/entities/student.entity'
import { UserService } from './services/user.service'

@Module({
  imports: [TypeOrmModule.forFeature([Student, Advisor, Admin])],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
