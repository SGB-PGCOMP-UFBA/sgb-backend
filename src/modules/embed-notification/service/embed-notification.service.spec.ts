import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '@/core/testing/repository.mock'
import { EmbedNotificationService } from './embed-notification.service'

const VALID_DTO = {
  owner_id: 7,
  owner_type: 'STUDENT',
  title: 'Bolsa prorrogada',
  description: 'Sua bolsa foi prorrogada por mais 6 meses.'
} as never

function createDeleteQueryBuilderMock() {
  const queryBuilder: Record<string, unknown> = {}
  queryBuilder.delete = vi.fn(() => queryBuilder)
  queryBuilder.execute = vi.fn().mockResolvedValue({ affected: 5 })
  return queryBuilder as any
}

describe('EmbedNotificationService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let service: EmbedNotificationService

  beforeEach(() => {
    repository = createRepositoryMock()
    service = new EmbedNotificationService(repository)
  })

  describe('findAllBy', () => {
    it('quando busca as notificações do dono, traz só as não consumidas, as 10 mais recentes', async () => {
      await service.findAllBy(7, 'STUDENT')

      expect(repository.find).toHaveBeenCalledWith({
        where: { owner_id: 7, owner_type: 'STUDENT', consumed: false },
        order: { created_at: 'DESC' },
        take: 10
      })
    })

    it.each([['ADMIN'], ['ADVISOR'], ['STUDENT']])(
      'quando o tipo de dono é informado, filtra as notificações por ele (%s)',
      async (ownerType) => {
        await service.findAllBy(7, ownerType)

        expect(repository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ owner_type: ownerType })
          })
        )
      }
    )

    it('quando não há notificação pendente, devolve lista vazia', async () => {
      await expect(service.findAllBy(7, 'STUDENT')).resolves.toEqual([])
    })
  })

  describe('create', () => {
    it('quando o DTO é válido, cria a notificação com os dados dele e sem marcar consumed', async () => {
      const created = await service.create(VALID_DTO)

      expect(repository.create).toHaveBeenCalledWith({
        owner_id: 7,
        owner_type: 'STUDENT',
        title: 'Bolsa prorrogada',
        description: 'Sua bolsa foi prorrogada por mais 6 meses.'
      })
      expect(repository.save).toHaveBeenCalledWith(created)
      expect(repository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ consumed: expect.anything() })
      )
    })

    it('quando a persistência falha ao criar, traduz o erro em BadRequest', async () => {
      repository.save.mockRejectedValue(new Error('conexão perdida'))

      await expect(service.create(VALID_DTO)).rejects.toBeInstanceOf(
        BadRequestException
      )
    })
  })

  describe('consume', () => {
    it('quando a notificação é consumida, marca como lida sem tocar em título, descrição ou dono', async () => {
      await service.consume(31)

      expect(repository.save).toHaveBeenCalledWith({
        id: 31,
        consumed: true
      })
    })

    it('quando a persistência falha ao consumir, traduz o erro em BadRequest', async () => {
      repository.save.mockRejectedValue(new Error('conexão perdida'))

      await expect(service.consume(31)).rejects.toBeInstanceOf(
        BadRequestException
      )
    })
  })

  describe('delete', () => {
    it('quando a notificação é removida, devolve true', async () => {
      await expect(service.delete(31)).resolves.toBe(true)
      expect(repository.delete).toHaveBeenCalledWith(31)
    })

    it('quando não há notificação para remover, devolve false', async () => {
      repository.delete.mockResolvedValue({ affected: 0 })

      await expect(service.delete(999)).resolves.toBe(false)
    })
  })

  describe('deleteAll', () => {
    it('quando apaga todas as notificações, reinicia a sequência de ids', async () => {
      const queryBuilder = createDeleteQueryBuilderMock()
      repository.createQueryBuilder.mockReturnValue(queryBuilder)

      await service.deleteAll()

      expect(queryBuilder.delete).toHaveBeenCalled()
      expect(queryBuilder.execute).toHaveBeenCalled()
      expect(repository.query).toHaveBeenCalledWith(
        'ALTER SEQUENCE embed_notification_id_seq RESTART WITH 1'
      )
    })
  })
})
