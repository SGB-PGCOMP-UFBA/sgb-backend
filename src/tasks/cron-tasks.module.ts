import { Module } from '@nestjs/common'
import { EmbedNotificationModule } from '../modules/embed-notification/embed-notification.module';
import { ScholarshipModule } from '../modules/scholarship/scholarship.module';
import { ScholarShipFinalizerService } from './service/scholarship-finalizer.service';

@Module({
  imports: [
    ScholarshipModule,
    EmbedNotificationModule,
  ],
  providers: [ScholarShipFinalizerService],
})
export class CronTasksModule {}
