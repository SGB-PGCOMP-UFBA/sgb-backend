import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '../../../core/testing/repository.mock'
import { Agency } from '../entities/agency.entity'
import { AgencyService } from './agency.service'

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

function buildAgency(overrides: Partial<Agency> = {}): Agency {
  return {
    id: 1,
    name: 'CAPES',
    description: 'Agência de fomento',
    masters_degree_awarded_scholarships: 13,
    doctorate_degree_awarded_scholarships: 7,
    scholarships: [],
    ...overrides
  } as Agency
}

describe('AgencyService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let service: AgencyService

  beforeEach(() => {
    repository = createRepositoryMock()
    service = new AgencyService(repository)
  })

  describe('findOneByName', () => {
    it.each([[undefined], [null], ['']])(
      'quando o nome da agência é vazio, recusa a busca sem consultar o banco (%s)',
      async (name) => {
        await expect(
          service.findOneByName(name as string)
        ).rejects.toBeInstanceOf(NotFoundException)
        expect(repository.findOneBy).not.toHaveBeenCalled()
      }
    )

    it('quando o nome existe, devolve a agência', async () => {
      const agency = buildAgency()
      repository.findOneBy.mockResolvedValue(agency)

      await expect(service.findOneByName('CAPES')).resolves.toBe(agency)
      expect(repository.findOneBy).toHaveBeenCalledWith({ name: 'CAPES' })
    })

    it('quando o nome não existe, lança NotFound', async () => {
      repository.findOneBy.mockResolvedValue(null)

      await expect(service.findOneByName('INEXISTENTE')).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('update', () => {
    it('quando a atualização reduz as concedidas abaixo das já alocadas, recusa a mudança e não salva', async () => {
      repository.findOne.mockResolvedValue(
        buildAgency({
          scholarships: [
            buildScholarship(1, 'ON_GOING', 'MESTRADO'),
            buildScholarship(2, 'ON_GOING', 'MESTRADO'),
            buildScholarship(3, 'ON_GOING', 'MESTRADO')
          ]
        } as Partial<Agency>)
      )

      await expect(
        service.update(1, { masters_degree_awarded_scholarships: 2 } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a atualização zera as concedidas e existe vaga alocada, recusa a mudança', async () => {
      repository.findOne.mockResolvedValue(
        buildAgency({
          scholarships: [buildScholarship(1, 'ON_GOING', 'DOUTORADO')]
        } as Partial<Agency>)
      )

      await expect(
        service.update(1, { doctorate_degree_awarded_scholarships: 0 } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('quando as concedidas ficam iguais às alocadas, aceita a mudança e salva', async () => {
      repository.findOne.mockResolvedValue(
        buildAgency({
          scholarships: [
            buildScholarship(1, 'ON_GOING', 'MESTRADO'),
            buildScholarship(2, 'ON_GOING', 'MESTRADO')
          ]
        } as Partial<Agency>)
      )

      await service.update(1, {
        masters_degree_awarded_scholarships: 2
      } as never)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ masters_degree_awarded_scholarships: 2 })
      )
    })

    it('quando o dto não informa a cota, preserva o valor atual', async () => {
      repository.findOne.mockResolvedValue(buildAgency())

      await service.update(1, { name: 'CAPES/PROEX' } as never)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CAPES/PROEX',
          masters_degree_awarded_scholarships: 13,
          doctorate_degree_awarded_scholarships: 7
        })
      )
    })

    it('quando a agência não existe, lança NotFound', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(service.update(99, {} as never)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })
})
