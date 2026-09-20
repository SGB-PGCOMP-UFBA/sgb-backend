import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { EmbedNotificationService } from './embed-notification.service'

const VALID_DTO = {
  owner_id: 7,
  owner_type: 'STUDENT',
  title: 'Bolsa prorrogada',
  description: 'Sua bolsa foi prorrogada por mais 6 meses.'
} as never

function createEmbedNotificationRepositoryMock() {
  return {
    findPendingByOwner: vi.fn().mockResolvedValue([]),
    create: vi.fn(async (data: unknown) => data),
    markAsConsumed: vi.fn(async (id: number) => ({ id, consumed: true })),
    deleteById: vi.fn().mockResolvedValue(1),
    deleteAllAndResetSequence: vi.fn().mockResolvedValue(undefined)
  } satisfies Record<keyof EmbedNotificationRepository, unknown>
}

describe('EmbedNotificationService', () => {
  let repository: ReturnType<typeof createEmbedNotificationRepositoryMock>
  let service: EmbedNotificationService

  beforeEach(() => {
    repository = createEmbedNotificationRepositoryMock()
    service = new EmbedNotificationService(
      repository as unknown as EmbedNotificationRepository
    )
  })

  describe('findAllBy', () => {
    it.each([['ADMIN'], ['ADVISOR'], ['STUDENT']])(
      'repassa dono e tipo de dono para o repositório (%s)',
      async (ownerType) => {
        await service.findAllBy(7, ownerType)

        expect(repository.findPendingByOwner).toHaveBeenCalledWith(7, ownerType)
      }
    )

    it('quando não há notificação pendente, devolve lista vazia', async () => {
      await expect(service.findAllBy(7, 'STUDENT')).resolves.toEqual([])
    })
  })

  describe('create', () => {
    it('quando o DTO é válido, cria a notificação com os dados dele e sem marcar consumed', async () => {
      await service.create(VALID_DTO)

      expect(repository.create).toHaveBeenCalledWith(VALID_DTO)
      expect(repository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ consumed: expect.anything() })
      )
    })

    it('quando a persistência falha ao criar, traduz o erro em BadRequest', async () => {
      repository.create.mockRejectedValue(new Error('conexão perdida'))

      await expect(service.create(VALID_DTO)).rejects.toBeInstanceOf(
        BadRequestException
      )
    })
  })

  describe('consume', () => {
    it('quando a notificação é consumida, pede ao repositório para marcá-la como lida', async () => {
      await service.consume(31)

      expect(repository.markAsConsumed).toHaveBeenCalledWith(31)
    })

    it('quando a persistência falha ao consumir, traduz o erro em BadRequest', async () => {
      repository.markAsConsumed.mockRejectedValue(new Error('conexão perdida'))

      await expect(service.consume(31)).rejects.toBeInstanceOf(
        BadRequestException
      )
    })
  })

  describe('delete', () => {
    it('quando a notificação é removida, devolve true', async () => {
      await expect(service.delete(31)).resolves.toBe(true)
      expect(repository.deleteById).toHaveBeenCalledWith(31)
    })

    it('quando não há notificação para remover, devolve false', async () => {
      repository.deleteById.mockResolvedValue(0)

      await expect(service.delete(999)).resolves.toBe(false)
    })
  })

  describe('deleteAll', () => {
    it('delega ao repositório a limpeza total', async () => {
      await service.deleteAll()

      expect(repository.deleteAllAndResetSequence).toHaveBeenCalled()
    })
  })
})
