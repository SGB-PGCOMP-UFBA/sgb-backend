import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserManagementService } from './user-management.service'
import { UserAccountService } from './user-account.service'
import { UserRecordsService } from './user-records.service'
import { UserController } from './user.controller'
import { EmailModule } from '@/email/email.module'

@Module({
  imports: [EmailModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserManagementService,
    UserAccountService,
    UserRecordsService
  ],
  exports: [UserService]
})
export class UserModule {}
