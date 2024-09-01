import { Module } from '@nestjs/common'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { EnrollmentModule } from '../enrollment/enrollment.module'
import { StudentModule } from '../student/student.module'
import { DataManagerCsvService } from './service/data-manager-csv.service'
import { DataManagerJsonService } from './service/data-manager-json.service'
import { DataManagerController } from './controller/data-manager.controller'

@Module({
  imports: [ScholarshipModule, EnrollmentModule, StudentModule],
  controllers: [DataManagerController],
  providers: [DataManagerCsvService, DataManagerJsonService],
  exports: [DataManagerCsvService, DataManagerJsonService]
})
export class DataManagerModule {}
