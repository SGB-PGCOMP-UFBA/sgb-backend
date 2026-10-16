import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserManagementService } from './user-management.service'
import { UserController } from './user.controller'
import { StudentModule } from '@/student/student.module'
import { AdvisorModule } from '@/advisor/advisor.module'
import { AdminModule } from '@/admin/admin.module'
import { EmailModule } from '@/email/email.module'

@Module({
  imports: [StudentModule, AdvisorModule, AdminModule, EmailModule],
  controllers: [UserController],
  providers: [UserService, UserManagementService],
  exports: [UserService]
})
export class UserModule {}
