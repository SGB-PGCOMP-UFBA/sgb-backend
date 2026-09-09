import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  makeAllocation,
  makeScholarshipsForProgram
} from '@/core/testing/factories'
import { createRepositoryMock } from '@/core/testing/repository.mock'
import { AllocationService } from './allocation.service'

describe('AllocationService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let service: AllocationService

  beforeEach(() => {
    repository = createRepositoryMock()
    service = new AllocationService(repository)
  })

  describe('findOneByName', () => {
    it.each([[undefined], [null], ['']])(
      'quando o nome da alocação é vazio, recusa a busca sem consultar o banco (%s)',
      async (name) => {
        await expect(
          service.findOneByName(name as string)
        ).rejects.toBeInstanceOf(NotFoundException)
        expect(repository.findOneBy).not.toHaveBeenCalled()
      }
    )

    it('quando o nome existe, devolve a alocação', async () => {
      const allocation = makeAllocation()
      repository.findOneBy.mockResolvedValue(allocation)

      await expect(service.findOneByName('REMOTO')).resolves.toBe(allocation)
    })
  })

  describe('update', () => {
    it('quando a atualização reduz as concedidas abaixo das já alocadas, recusa a mudança e não salva', async () => {
      repository.findOne.mockResolvedValue(
        makeAllocation({
          scholarships: makeScholarshipsForProgram(2, 'MESTRADO')
        })
      )

      await expect(
        service.update(1, { masters_degree_awarded_scholarships: 1 } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a atualização aumenta as concedidas, aceita a mudança e salva', async () => {
      repository.findOne.mockResolvedValue(
        makeAllocation({
          scholarships: makeScholarshipsForProgram(1, 'MESTRADO')
        })
      )

      await service.update(1, {
        masters_degree_awarded_scholarships: 20
      } as never)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ masters_degree_awarded_scholarships: 20 })
      )
    })

    it('quando a alocação não existe, lança NotFound', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(service.update(99, {} as never)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })
})
