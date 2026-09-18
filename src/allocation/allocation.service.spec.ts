import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAllocation,
  makeScholarshipsForProgram
} from '@/common/testing/factories'
import { AllocationRepository } from '@/allocation/repositories/allocation.repository'
import { AllocationService } from './allocation.service'

/**
 * O `satisfies` garante cobertura: se um método novo entrar em
 * AllocationRepository e não for adicionado aqui, o typecheck quebra.
 */
function createAllocationRepositoryMock() {
  return {
    findAllWithScholarships: vi.fn().mockResolvedValue([]),
    findAllForFilter: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByIdWithScholarships: vi.fn().mockResolvedValue(null),
    findByName: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (data: unknown) => data),
    update: vi.fn(async (_allocation: unknown, changes: unknown) => changes),
    deleteById: vi.fn().mockResolvedValue(1)
  } satisfies Record<keyof AllocationRepository, unknown>
}

describe('AllocationService', () => {
  let repository: ReturnType<typeof createAllocationRepositoryMock>
  let service: AllocationService

  beforeEach(() => {
    repository = createAllocationRepositoryMock()
    service = new AllocationService(
      repository as unknown as AllocationRepository
    )
  })

  describe('findOneByName', () => {
    it.each([[undefined], [null], ['']])(
      'quando o nome da alocação é vazio, recusa a busca sem consultar o banco (%s)',
      async (name) => {
        await expect(
          service.findOneByName(name as string)
        ).rejects.toBeInstanceOf(NotFoundException)
        expect(repository.findByName).not.toHaveBeenCalled()
      }
    )

    it('quando o nome existe, devolve a alocação', async () => {
      const allocation = makeAllocation()
      repository.findByName.mockResolvedValue(allocation)

      await expect(service.findOneByName('REMOTO')).resolves.toBe(allocation)
    })
  })

  describe('update', () => {
    it('quando a atualização reduz as concedidas abaixo das já alocadas, recusa a mudança e não salva', async () => {
      repository.findByIdWithScholarships.mockResolvedValue(
        makeAllocation({
          scholarships: makeScholarshipsForProgram(2, 'MESTRADO')
        })
      )

      await expect(
        service.update(1, { masters_degree_awarded_scholarships: 1 } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a atualização aumenta as concedidas, aceita a mudança e salva', async () => {
      repository.findByIdWithScholarships.mockResolvedValue(
        makeAllocation({
          scholarships: makeScholarshipsForProgram(1, 'MESTRADO')
        })
      )

      await service.update(1, {
        masters_degree_awarded_scholarships: 20
      } as never)

      expect(repository.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ masters_degree_awarded_scholarships: 20 })
      )
    })

    it('quando a alocação não existe, lança NotFound', async () => {
      repository.findByIdWithScholarships.mockResolvedValue(null)

      await expect(service.update(99, {} as never)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('delete', () => {
    it('quando nada é removido, lança NotFound', async () => {
      repository.deleteById.mockResolvedValue(0)

      await expect(service.delete(99)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando remove, devolve true', async () => {
      await expect(service.delete(1)).resolves.toBe(true)
    })
  })
})
