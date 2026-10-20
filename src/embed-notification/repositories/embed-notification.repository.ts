import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { CreateEmbedNotificationDto } from '@/embed-notification/dtos/create-embed-notification.dto'

export abstract class EmbedNotificationRepository {
  abstract findPendingByOwner(
    ownerId: number,
    ownerType: string
  ): Promise<EmbedNotification[]>
  abstract findByIdAndOwner(
    id: number,
    ownerId: number,
    ownerType: string
  ): Promise<EmbedNotification | null>
  abstract create(data: CreateEmbedNotificationDto): Promise<EmbedNotification>
  abstract markAsConsumed(id: number): Promise<void>
  abstract deleteById(id: number): Promise<number>
}
