import { Module } from '@nestjs/common'
import { ScholarshipModule } from '@/modules/scholarship/scholarship.module'
import { EnrollmentModule } from '@/modules/enrollment/enrollment.module'
import { StudentModule } from '@/modules/student/student.module'
import { EmbedNotificationModule } from '@/modules/embed-notification/embed-notification.module'
import { DataManagerCsvService } from './service/data-manager-csv.service'
import { DataManagerJsonService } from './service/data-manager-json.service'
import { DataManagerPurgeService } from './service/data-manager-purge.service'
import { DataManagerController } from './controller/data-manager.controller'
import { PendingScholarshipModule } from '@/modules/pending-scholarship/pending-scholarship.module'

@Module({
  imports: [
    ScholarshipModule,
    EnrollmentModule,
    StudentModule,
    EmbedNotificationModule,
    PendingScholarshipModule
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
