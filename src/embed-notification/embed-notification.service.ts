import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { CreateEmbedNotificationDto } from '@/embed-notification/dtos/create-embed-notification.dto'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { constants } from '@/common/utils/constants'
import { NotificationOwner } from '@/embed-notification/notification-owner.util'

@Injectable()
export class EmbedNotificationService {
  private readonly logger = new Logger(EmbedNotificationService.name)

  constructor(
    private readonly embedNotificationRepository: EmbedNotificationRepository
  ) {}

  async findAllBy(owner: NotificationOwner): Promise<EmbedNotification[]> {
    return await this.embedNotificationRepository.findPendingByOwner(
      owner.owner_id,
      owner.owner_type
    )
  }

  async create(dto: CreateEmbedNotificationDto): Promise<EmbedNotification> {
    const newNotification = await this.embedNotificationRepository.create(dto)

    this.logger.log(constants.exceptionMessages.notification.CREATION_COMPLETED)

    return newNotification
  }

  /**
   * Notificação de outro dono responde o mesmo 404 de uma inexistente, para
   * não revelar quais ids existem.
   */
  async consume(
    id: number,
    owner: NotificationOwner
  ): Promise<EmbedNotification> {
    const notification =
      await this.embedNotificationRepository.findByIdAndOwner(
        id,
        owner.owner_id,
        owner.owner_type
      )

    if (!notification) {
      throw new NotFoundException(
        constants.exceptionMessages.notification.NOT_FOUND
      )
    }

    await this.embedNotificationRepository.markAsConsumed(id)

    return { ...notification, consumed: true }
  }

  async delete(id: number) {
    const affected = await this.embedNotificationRepository.deleteById(id)
    return affected === 1
  }
}
