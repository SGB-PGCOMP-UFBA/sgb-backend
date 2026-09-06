import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRepositoryMock } from '../../../core/testing/repository.mock'
import { Allocation } from '../entities/allocation.entity'
import { AllocationService } from './allocation.service'

function buildScholarship(
  enrollmentId: number,
  status: string,
  program: string
) {
  return {
    enrollment_id: enrollmentId,
    status,
    enrollment: { id: enrollmentId, enrollment_program: program }
  }
}

function buildAllocation(overrides: Partial<Allocation> = {}): Allocation {
  return {
    id: 1,
    name: 'REMOTO',
    masters_degree_awarded_scholarships: 10,
    doctorate_degree_awarded_scholarships: 5,
    scholarships: [],
    ...overrides
  } as Allocation
}

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
      const allocation = buildAllocation()
      repository.findOneBy.mockResolvedValue(allocation)

      await expect(service.findOneByName('REMOTO')).resolves.toBe(allocation)
    })
  })

  describe('update', () => {
    it('quando a atualização reduz as concedidas abaixo das já alocadas, recusa a mudança e não salva', async () => {
      repository.findOne.mockResolvedValue(
        buildAllocation({
          scholarships: [
            buildScholarship(1, 'ON_GOING', 'MESTRADO'),
            buildScholarship(2, 'ON_GOING', 'MESTRADO')
          ]
        } as Partial<Allocation>)
      )

      await expect(
        service.update(1, { masters_degree_awarded_scholarships: 1 } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a atualização aumenta as concedidas, aceita a mudança e salva', async () => {
      repository.findOne.mockResolvedValue(
        buildAllocation({
          scholarships: [buildScholarship(1, 'ON_GOING', 'MESTRADO')]
        } as Partial<Allocation>)
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
