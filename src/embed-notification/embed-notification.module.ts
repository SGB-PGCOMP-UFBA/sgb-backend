import { Module } from '@nestjs/common'
import { EmbedNotificationController } from './embed-notification.controller'
import { EmbedNotificationService } from './embed-notification.service'

@Module({
  controllers: [EmbedNotificationController],
  providers: [EmbedNotificationService],
  exports: [EmbedNotificationService]
})
export class EmbedNotificationModule {}
