import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { CreateEmbedNotificationDto } from '@/embed-notification/dtos/create-embed-notification.dto'

export interface NotificationPageOptions {
  page: number
  limit: number
  onlyUnconsumed?: boolean
}

export abstract class EmbedNotificationRepository {
  abstract findPendingByOwner(
    ownerId: number,
    ownerType: string
  ): Promise<EmbedNotification[]>
  abstract findPageByOwner(
    ownerId: number,
    ownerType: string,
    options: NotificationPageOptions
  ): Promise<[EmbedNotification[], number]>
  abstract countUnconsumedByOwner(
    ownerId: number,
    ownerType: string
  ): Promise<number>
  abstract findByIdAndOwner(
    id: number,
    ownerId: number,
    ownerType: string
  ): Promise<EmbedNotification | null>
  abstract create(data: CreateEmbedNotificationDto): Promise<EmbedNotification>
  abstract markAsConsumed(id: number): Promise<void>
  abstract markAllAsConsumedByOwner(
    ownerId: number,
    ownerType: string
  ): Promise<number>
  abstract deleteById(id: number): Promise<number>
}
