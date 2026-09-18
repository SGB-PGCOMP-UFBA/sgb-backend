import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { TypeOrmEmbedNotificationRepository } from './typeorm-embed-notification.repository'

function createDeleteQueryBuilderMock() {
  const queryBuilder: Record<string, ReturnType<typeof vi.fn>> = {}
  queryBuilder.delete = vi.fn(() => queryBuilder)
  queryBuilder.execute = vi.fn().mockResolvedValue({ affected: 5 })
  return queryBuilder
}

describe('TypeOrmEmbedNotificationRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmEmbedNotificationRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmEmbedNotificationRepository(typeorm)
  })

  it('findPendingByOwner traz só as não consumidas, as 10 mais recentes', async () => {
    await repository.findPendingByOwner(7, 'STUDENT')

    expect(typeorm.find).toHaveBeenCalledWith({
      where: { owner_id: 7, owner_type: 'STUDENT', consumed: false },
      order: { created_at: 'DESC' },
      take: 10
    })
  })

  it('markAsConsumed marca como lida sem tocar em título, descrição ou dono', async () => {
    await repository.markAsConsumed(31)

    expect(typeorm.save).toHaveBeenCalledWith({ id: 31, consumed: true })
  })

  it('deleteAllAndResetSequence apaga tudo e reinicia a sequência de ids', async () => {
    const queryBuilder = createDeleteQueryBuilderMock()
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

    await repository.deleteAllAndResetSequence()

    expect(queryBuilder.delete).toHaveBeenCalled()
    expect(queryBuilder.execute).toHaveBeenCalled()
    expect(typeorm.query).toHaveBeenCalledWith(
      'ALTER SEQUENCE embed_notification_id_seq RESTART WITH 1'
    )
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(31)).resolves.toBe(1)
  })
})
