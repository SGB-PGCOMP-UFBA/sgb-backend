import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAgency,
  makeAllocation,
  makeEnrollment,
  makeScholarship,
  makeStudent
} from '@/core/testing/factories'
import {
  createQueryBuilderMock,
  createRepositoryMock
} from '@/core/testing/repository.mock'
import { ScholarshipService } from './scholarship.service'

const AGENCY = makeAgency()

const ALLOCATION = makeAllocation({
  masters_degree_awarded_scholarships: 50,
  doctorate_degree_awarded_scholarships: 50
})

const ENROLLMENT = makeEnrollment()

const VALID_DTO = {
  student_email: 'aluno@ufba.br',
  enrollment_number: '2024123456',
  agency_name: 'CAPES',
  allocation_name: 'REMOTO',
  scholarship_starts_at: new Date('2026-01-01'),
  scholarship_ends_at: new Date('2026-12-01')
} as never

function rowsForCount(total: number) {
  return Array.from({ length: total }, (_, index) => ({ id: index + 1 }))
}

describe('ScholarshipService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let agencyService: any
  let allocationService: any
  let enrollmentService: any
  let studentService: any
  let service: ScholarshipService

  beforeEach(() => {
    repository = createRepositoryMock()
    agencyService = {
      findOneByName: vi.fn().mockResolvedValue(AGENCY),
      findOneById: vi.fn().mockResolvedValue(AGENCY)
    }
    allocationService = {
      findOneByName: vi.fn().mockResolvedValue(ALLOCATION),
      findOneById: vi.fn().mockResolvedValue(ALLOCATION)
    }
    enrollmentService = {
      findOneByStudentEmailAndEnrollmentNumber: vi
        .fn()
        .mockResolvedValue(ENROLLMENT),
      findOneByIdAndStudentId: vi.fn().mockResolvedValue(ENROLLMENT)
    }
    studentService = { findByEmail: vi.fn().mockResolvedValue(makeStudent()) }

    service = new ScholarshipService(
      repository,
      agencyService,
      allocationService,
      enrollmentService,
      studentService
    )
  })

  function withAllocatedSlots(total: number) {
    repository.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock(rowsForCount(total))
    )
  }

  describe('create', () => {
    it('quando ainda há vaga concedida, cria a bolsa', async () => {
      withAllocatedSlots(3)

      await service.create(VALID_DTO)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          agency_id: AGENCY.id,
          allocation_id: ALLOCATION.id,
          enrollment_id: ENROLLMENT.id,
          status: 'ON_GOING'
        })
      )
    })

    it('quando a agência concedeu 13 vagas e todas estão ocupadas, bloqueia a 14ª bolsa e não salva', async () => {
      withAllocatedSlots(13)

      await expect(service.create(VALID_DTO)).rejects.toBeInstanceOf(
        BadRequestException
      )
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a agência está lotada, explica no erro quantas vagas existem e quantas estão alocadas', async () => {
      withAllocatedSlots(13)

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /CAPES possui 13 vaga\(s\) de Mestrado concedida\(s\) e 13 já alocada\(s\)/
      )
    })

    it('quando a agência não tem cota cadastrada, bloqueia a criação', async () => {
      agencyService.findOneByName.mockResolvedValue(
        makeAgency({ masters_degree_awarded_scholarships: 0 })
      )
      withAllocatedSlots(0)

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /não possui vagas de Mestrado concedidas/
      )
    })

    it('quando a alocação está lotada e ainda há vaga na agência, bloqueia a criação e não salva', async () => {
      allocationService.findOneByName.mockResolvedValue(
        makeAllocation({ masters_degree_awarded_scholarships: 2 })
      )

      repository.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilderMock(rowsForCount(1)))
        .mockReturnValueOnce(createQueryBuilderMock(rowsForCount(2)))

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /A alocação REMOTO/
      )
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a matrícula já tem bolsa vigente, recusa cadastrar outra', async () => {
      withAllocatedSlots(3)
      repository.count.mockResolvedValue(1)

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /já possui uma bolsa vigente/
      )
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a matrícula não tem bolsa vigente, deixa cadastrar', async () => {
      withAllocatedSlots(3)
      repository.count.mockResolvedValue(0)

      await service.create(VALID_DTO)

      expect(repository.save).toHaveBeenCalled()
    })

    it('quando a bolsa é cadastrada já finalizada, não valida cota e salva', async () => {
      withAllocatedSlots(13)

      await service.create({
        ...(VALID_DTO as object),
        status: 'FINISHED'
      } as never)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FINISHED' })
      )
    })

    it('quando já existe bolsa com os mesmos dados, recusa a criação', async () => {
      repository.findOneBy.mockResolvedValue({ id: 1 })

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /Já existe uma bolsa/
      )
    })

    it('quando a data de término é anterior à de início, recusa a criação e não salva', async () => {
      withAllocatedSlots(0)

      await expect(
        service.create({
          ...(VALID_DTO as object),
          scholarship_ends_at: new Date('2025-01-01')
        } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando o mestrado passa de 2 anos de duração, recusa a criação', async () => {
      withAllocatedSlots(0)

      await expect(
        service.create({
          ...(VALID_DTO as object),
          scholarship_ends_at: new Date('2029-01-01')
        } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
    })
  })

  describe('update', () => {
    const UPDATE_DTO = {
      enrollment_id: ENROLLMENT.id,
      student_email: 'aluno@ufba.br',
      status: 'ON_GOING',
      scholarship_starts_at: new Date('2026-01-01'),
      scholarship_ends_at: new Date('2026-12-01')
    } as never

    const EXISTING = makeScholarship({ id: 900 })

    beforeEach(() => {
      repository.findOneBy
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(EXISTING)
    })

    it('quando a bolsa é movida para uma agência sem vaga, bloqueia a mudança e não salva', async () => {
      agencyService.findOneById.mockResolvedValue(
        makeAgency({
          id: 2,
          name: 'CNPQ',
          masters_degree_awarded_scholarships: 1
        })
      )
      withAllocatedSlots(1)

      await expect(
        service.update(900, {
          ...(UPDATE_DTO as object),
          agency_id: 2
        } as never)
      ).rejects.toThrow(/A agência CNPQ/)
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a bolsa é atualizada, exclui a própria bolsa da contagem de vagas ocupadas', async () => {
      const queryBuilder = createQueryBuilderMock(rowsForCount(2))
      repository.createQueryBuilder.mockReturnValue(queryBuilder)

      await service.update(900, UPDATE_DTO)

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'scholarship.id != :excludingScholarshipId',
        { excludingScholarshipId: EXISTING.id }
      )
      expect(repository.save).toHaveBeenCalled()
    })

    it('quando a bolsa é finalizada, não valida cota e salva', async () => {
      withAllocatedSlots(13)

      await service.update(900, {
        ...(UPDATE_DTO as object),
        status: 'FINISHED'
      } as never)

      expect(agencyService.findOneById).not.toHaveBeenCalled()
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FINISHED' })
      )
    })
  })
})
