import { Module } from '@nestjs/common'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { DataManagerService } from './service/data-manager.service'
import { DataManagerController } from './controller/data-manager.controller'

@Module({
  imports: [ScholarshipModule],
  controllers: [DataManagerController],
  providers: [DataManagerService],
  exports: [DataManagerService]
})
export class DataManagerModule {}
