import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAgency,
  makeScholarshipsForProgram
} from '@/common/testing/factories'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { AgencyService } from './agency.service'

/**
 * O `satisfies` garante cobertura: se um método novo entrar em
 * AgencyRepository e não for adicionado aqui, o typecheck quebra.
 */
function createAgencyRepositoryMock() {
  return {
    findAllWithScholarships: vi.fn().mockResolvedValue([]),
    findAllForFilter: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByIdWithScholarships: vi.fn().mockResolvedValue(null),
    findByName: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (data: unknown) => data),
    update: vi.fn(async (_id: number, data: unknown) => data),
    deleteById: vi.fn().mockResolvedValue(1)
  } satisfies Record<keyof AgencyRepository, unknown>
}

describe('AgencyService', () => {
  let repository: ReturnType<typeof createAgencyRepositoryMock>
  let service: AgencyService

  beforeEach(() => {
    repository = createAgencyRepositoryMock()
    service = new AgencyService(repository as unknown as AgencyRepository)
  })

  describe('findOneByName', () => {
    it.each([[undefined], [null], ['']])(
      'quando o nome da agência é vazio, recusa a busca sem consultar o banco (%s)',
      async (name) => {
        await expect(
          service.findOneByName(name as string)
        ).rejects.toBeInstanceOf(NotFoundException)
        expect(repository.findByName).not.toHaveBeenCalled()
      }
    )

    it('quando o nome existe, devolve a agência', async () => {
      const agency = makeAgency()
      repository.findByName.mockResolvedValue(agency)

      await expect(service.findOneByName('CAPES')).resolves.toBe(agency)
      expect(repository.findByName).toHaveBeenCalledWith('CAPES')
    })

    it('quando o nome não existe, lança NotFound', async () => {
      repository.findByName.mockResolvedValue(null)

      await expect(service.findOneByName('INEXISTENTE')).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('update', () => {
    it('quando a atualização reduz as concedidas abaixo das já alocadas, recusa a mudança e não salva', async () => {
      repository.findByIdWithScholarships.mockResolvedValue(
        makeAgency({ scholarships: makeScholarshipsForProgram(3, 'MESTRADO') })
      )

      await expect(
        service.update(1, { masters_degree_awarded_scholarships: 2 } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a atualização zera as concedidas e existe vaga alocada, recusa a mudança', async () => {
      repository.findByIdWithScholarships.mockResolvedValue(
        makeAgency({ scholarships: makeScholarshipsForProgram(1, 'DOUTORADO') })
      )

      await expect(
        service.update(1, { doctorate_degree_awarded_scholarships: 0 } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('quando as concedidas ficam iguais às alocadas, aceita a mudança e salva', async () => {
      repository.findByIdWithScholarships.mockResolvedValue(
        makeAgency({ scholarships: makeScholarshipsForProgram(2, 'MESTRADO') })
      )

      await service.update(1, {
        masters_degree_awarded_scholarships: 2
      } as never)

      expect(repository.update).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ masters_degree_awarded_scholarships: 2 })
      )
    })

    it('quando o dto não informa a cota, preserva o valor atual', async () => {
      repository.findByIdWithScholarships.mockResolvedValue(makeAgency())

      await service.update(1, { name: 'CAPES/PROEX' } as never)

      expect(repository.update).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          name: 'CAPES/PROEX',
          masters_degree_awarded_scholarships: 13,
          doctorate_degree_awarded_scholarships: 7
        })
      )
    })

    it('quando a agência não existe, lança NotFound', async () => {
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

    it('quando remove uma linha, devolve true', async () => {
      repository.deleteById.mockResolvedValue(1)

      await expect(service.delete(1)).resolves.toBe(true)
    })
  })
})
