import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EmbedNotification } from '../entity/embed-notification.entity'
import { CreateEmbedNotificationDto } from '../dto/create-embed-notification.dto'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class EmbedNotificationService {
  constructor(
    @InjectRepository(EmbedNotification)
    private embedNotificationRepository: Repository<EmbedNotification>
  ) {}

  async findAllBy(
    owner_id: number,
    owner_type: string
  ): Promise<EmbedNotification[]> {
    return await this.embedNotificationRepository.find({
      where: { owner_id, owner_type, consumed: false },
      order: { created_at: 'DESC' }
    })
  }

  async create(dto: CreateEmbedNotificationDto): Promise<EmbedNotification> {
    try {
      const newNotification = this.embedNotificationRepository.create({
        ...dto
      })
      await this.embedNotificationRepository.save(newNotification)

      return newNotification
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.notification.CREATION_FAILED
      )
    }
  }

  async delete(id: number) {
    const removed = await this.embedNotificationRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    return false
  }
}
