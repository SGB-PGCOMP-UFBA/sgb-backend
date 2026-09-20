import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { CreateEmbedNotificationDto } from '@/embed-notification/dtos/create-embed-notification.dto'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { constants } from '@/common/utils/constants'

@Injectable()
export class EmbedNotificationService {
  private readonly logger = new Logger(EmbedNotificationService.name)

  constructor(
    private readonly embedNotificationRepository: EmbedNotificationRepository
  ) {}

  async findAllBy(
    owner_id: number,
    owner_type: string
  ): Promise<EmbedNotification[]> {
    return await this.embedNotificationRepository.findPendingByOwner(
      owner_id,
      owner_type
    )
  }

  async create(dto: CreateEmbedNotificationDto): Promise<EmbedNotification> {
    try {
      const newNotification = await this.embedNotificationRepository.create(dto)

      this.logger.log(
        constants.exceptionMessages.notification.CREATION_COMPLETED
      )

      return newNotification
    } catch (error) {
      this.logger.error(
        constants.exceptionMessages.notification.CREATION_FAILED,
        error
      )
      throw new BadRequestException(
        constants.exceptionMessages.notification.CREATION_FAILED
      )
    }
  }

  async consume(id: number): Promise<EmbedNotification> {
    try {
      return await this.embedNotificationRepository.markAsConsumed(id)
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.notification.UPDATE_FAILED
      )
    }
  }

  async delete(id: number) {
    const affected = await this.embedNotificationRepository.deleteById(id)
    return affected === 1
  }

  async deleteAll() {
    this.logger.warn(
      constants.exceptionMessages.notification.DELETE_ALL_STARTED
    )
    await this.embedNotificationRepository.deleteAllAndResetSequence()
  }
}
