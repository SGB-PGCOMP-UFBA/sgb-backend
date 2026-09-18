import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { CreateEmbedNotificationDto } from '@/embed-notification/dtos/create-embed-notification.dto'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'

/** Teto de notificações pendentes devolvidas por dono. */
const PENDING_LIMIT = 10

@Injectable()
export class TypeOrmEmbedNotificationRepository
  implements EmbedNotificationRepository
{
  constructor(
    @InjectRepository(EmbedNotification)
    private readonly repository: Repository<EmbedNotification>
  ) {}

  async findPendingByOwner(
    ownerId: number,
    ownerType: string
  ): Promise<EmbedNotification[]> {
    return await this.repository.find({
      where: { owner_id: ownerId, owner_type: ownerType, consumed: false },
      order: { created_at: 'DESC' },
      take: PENDING_LIMIT
    })
  }

  async create(data: CreateEmbedNotificationDto): Promise<EmbedNotification> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async markAsConsumed(id: number): Promise<EmbedNotification> {
    return await this.repository.save({ id, consumed: true })
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }

  async deleteAllAndResetSequence(): Promise<void> {
    await this.repository.createQueryBuilder().delete().execute()
    await this.repository.query(
      `ALTER SEQUENCE embed_notification_id_seq RESTART WITH 1`
    )
  }
}
