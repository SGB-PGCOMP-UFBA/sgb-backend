import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { CreateEmbedNotificationDto } from '@/embed-notification/dtos/create-embed-notification.dto'

/**
 * Contrato de acesso a dados de EmbedNotification.
 *
 * O binding para a implementação concreta vive no DatabaseModule.
 */
export abstract class EmbedNotificationRepository {
  /**
   * Notificações ainda não consumidas de um dono, das mais recentes para as
   * mais antigas, limitadas ao teto definido na implementação.
   */
  abstract findPendingByOwner(
    ownerId: number,
    ownerType: string
  ): Promise<EmbedNotification[]>

  abstract create(data: CreateEmbedNotificationDto): Promise<EmbedNotification>

  abstract markAsConsumed(id: number): Promise<EmbedNotification>

  /** Quantidade de linhas removidas. */
  abstract deleteById(id: number): Promise<number>

  /** Apaga todas as notificações e reinicia a sequência de ids. */
  abstract deleteAllAndResetSequence(): Promise<void>
}
