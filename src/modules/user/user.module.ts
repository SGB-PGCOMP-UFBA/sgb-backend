import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminService } from '../admin/service/admin.service'
import { Admin } from '../admin/entities/admin.entity'
import { AdvisorModule } from '../advisor/advisor.module'
import { Advisor } from '../advisor/entities/advisor.entity'
import { Student } from '../student/entities/student.entity'
import { StudentModule } from '../student/student.module'
import { UserService } from './services/user.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Advisor, Admin]),
    StudentModule,
    AdvisorModule
  ],
  providers: [UserService, AdminService],
  exports: [UserService]
})
export class UserModule {}
