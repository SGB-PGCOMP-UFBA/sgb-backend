import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminService } from './service/admin.service'
import { AdminController } from './controller/admin.controller'
import { Admin } from './entities/admin.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
