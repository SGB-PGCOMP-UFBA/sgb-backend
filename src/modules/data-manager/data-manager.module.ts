import { Module } from '@nestjs/common'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { EnrollmentModule } from '../enrollment/enrollment.module'
import { StudentModule } from '../student/student.module'
import { EmbedNotificationModule } from '../embed-notification/embed-notification.module'
import { DataManagerCsvService } from './service/data-manager-csv.service'
import { DataManagerJsonService } from './service/data-manager-json.service'
import { DataManagerPurgeService } from './service/data-manager-purge.service'
import { DataManagerController } from './controller/data-manager.controller'

@Module({
  imports: [
    ScholarshipModule,
    EnrollmentModule,
    StudentModule,
    EmbedNotificationModule
  ],
  controllers: [DataManagerController],
  providers: [
    DataManagerCsvService,
    DataManagerJsonService,
    DataManagerPurgeService
  ],
  exports: [
    DataManagerCsvService,
    DataManagerJsonService,
    DataManagerPurgeService
  ]
})
export class DataManagerModule {}
