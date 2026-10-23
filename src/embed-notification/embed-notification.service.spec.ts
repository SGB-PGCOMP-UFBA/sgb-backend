import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { makeEmbedNotification } from '@/common/testing/factories'
import { EmbedNotificationService } from './embed-notification.service'

const OWNER = { owner_id: 7, owner_type: 'STUDENT' } as const

const VALID_DTO = {
  owner_id: 7,
  owner_type: 'STUDENT',
  title: 'Bolsa prorrogada',
  description: 'Sua bolsa foi prorrogada por mais 6 meses.'
} as never

function createEmbedNotificationRepositoryMock() {
  return {
    findPendingByOwner: vi.fn().mockResolvedValue([]),
    findByIdAndOwner: vi.fn().mockResolvedValue(makeEmbedNotification()),
    create: vi.fn(async (data: unknown) => data),
    markAsConsumed: vi.fn().mockResolvedValue(undefined),
    deleteById: vi.fn().mockResolvedValue(1)
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
    it.each([['ADMIN'], ['ADVISOR'], ['STUDENT']] as const)(
      'repassa dono e tipo de dono para o repositório (%s)',
      async (ownerType) => {
        await service.findAllBy({ owner_id: 7, owner_type: ownerType })

        expect(repository.findPendingByOwner).toHaveBeenCalledWith(7, ownerType)
      }
    )

    it('quando não há notificação pendente, devolve lista vazia', async () => {
      await expect(service.findAllBy(OWNER)).resolves.toEqual([])
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

    it('quando a persistência falha ao criar, deixa o erro original subir para o filtro global', async () => {
      const failure = new Error('conexão perdida')
      repository.create.mockRejectedValue(failure)

      await expect(service.create(VALID_DTO)).rejects.toBe(failure)
    })
  })

  describe('consume', () => {
    it('quando a notificação é do dono, marca como lida e devolve a notificação consumida', async () => {
      const result = await service.consume(55, OWNER)

      expect(repository.findByIdAndOwner).toHaveBeenCalledWith(55, 7, 'STUDENT')
      expect(repository.markAsConsumed).toHaveBeenCalledWith(55)
      expect(result).toMatchObject({ id: 55, consumed: true })
    })

    it('quando a notificação não existe ou é de outro dono, recusa com 404 sem alterar nada', async () => {
      repository.findByIdAndOwner.mockResolvedValue(null)

      await expect(service.consume(55, OWNER)).rejects.toBeInstanceOf(
        NotFoundException
      )
      expect(repository.markAsConsumed).not.toHaveBeenCalled()
    })

    it('quando a persistência falha ao consumir, deixa o erro original subir para o filtro global', async () => {
      const failure = new Error('conexão perdida')
      repository.markAsConsumed.mockRejectedValue(failure)

      await expect(service.consume(55, OWNER)).rejects.toBe(failure)
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
})
