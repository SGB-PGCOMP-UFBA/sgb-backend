import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { CreateEmbedNotificationDto } from '@/embed-notification/dtos/create-embed-notification.dto'

export abstract class EmbedNotificationRepository {
  abstract findPendingByOwner(
    ownerId: number,
    ownerType: string
  ): Promise<EmbedNotification[]>
  abstract create(data: CreateEmbedNotificationDto): Promise<EmbedNotification>
  abstract markAsConsumed(id: number): Promise<EmbedNotification>
  abstract deleteById(id: number): Promise<number>
  abstract deleteAllAndResetSequence(): Promise<void>
}
