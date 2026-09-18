import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmbedNotificationController } from './embed-notification.controller'
import { EmbedNotificationService } from './embed-notification.service'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'

@Module({
  imports: [TypeOrmModule.forFeature([EmbedNotification])],
  controllers: [EmbedNotificationController],
  providers: [EmbedNotificationService],
  exports: [EmbedNotificationService]
})
export class EmbedNotificationModule {}
