import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmbedNotificationController } from './controller/embed-notification.controller'
import { EmbedNotificationService } from './service/embed-notification.service'
import { EmbedNotification } from './entity/embed-notification.entity'

@Module({
  imports: [TypeOrmModule.forFeature([EmbedNotification])],
  controllers: [EmbedNotificationController],
  providers: [EmbedNotificationService],
  exports: [EmbedNotificationService]
})
export class EmbedNotificationModule {}
