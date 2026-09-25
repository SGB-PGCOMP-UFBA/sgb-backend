import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  notStartedScholarship,
  extendedScholarship,
  daysFromToday,
  makeAgency,
  makeAllocation,
  makeEnrollment,
  makeScholarship,
  makeStudent
} from '@/common/testing/factories'
import { ScholarshipRepository } from '@/scholarship/repositories/scholarship.repository'
import { ScholarshipService } from './scholarship.service'
import { FindScholarshipsForReportDto } from '@/scholarship/dtos/find-scholarships-for-report.dto'

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

function createScholarshipRepositoryMock() {
  return {
    findAllWithRelations: vi.fn().mockResolvedValue([]),
    findPaginated: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    findAllOccupyingSlot: vi.fn().mockResolvedValue([]),
    findAllEndingOn: vi.fn().mockResolvedValue([]),
    findAllEndingBetween: vi.fn().mockResolvedValue([]),
    findByIdAndEnrollmentId: vi.fn().mockResolvedValue(null),
    findDuplicateForCreate: vi.fn().mockResolvedValue(null),
    findDuplicateForUpdate: vi.fn().mockResolvedValue(null),
    findMatchForCsvUpdate: vi.fn().mockResolvedValue(null),
    findAllForReport: vi.fn().mockResolvedValue([]),
    findDistinctStudentEmails: vi.fn().mockResolvedValue([]),
    countOccupyingSlotByEnrollment: vi.fn().mockResolvedValue(0),
    countAllocatedSlots: vi.fn().mockResolvedValue(0),
    countByProgramAndYear: vi.fn().mockResolvedValue([]),
    countByAgencyForProgramAndStatus: vi.fn().mockResolvedValue([]),
    countByStatusForAgency: vi.fn().mockResolvedValue([]),
    countAsReportBetweenDates: vi.fn().mockResolvedValue([]),
    create: vi.fn(async (data: unknown) => data),
    update: vi.fn(async (_id: number, data: unknown) => data),
    updateFields: vi.fn().mockResolvedValue(undefined),
    deleteById: vi.fn().mockResolvedValue(1),
    deleteAllAndResetSequence: vi.fn().mockResolvedValue(undefined)
  } satisfies Record<keyof ScholarshipRepository, unknown>
}

describe('ScholarshipService', () => {
  let repository: ReturnType<typeof createScholarshipRepositoryMock>
  let agencyService: any
  let allocationService: any
  let enrollmentService: any
  let studentService: any
  let service: ScholarshipService

  beforeEach(() => {
    repository = createScholarshipRepositoryMock()
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
      repository as unknown as ScholarshipRepository,
      agencyService,
      allocationService,
      enrollmentService,
      studentService
    )
  })

  function withAllocatedSlots(total: number) {
    repository.countAllocatedSlots.mockResolvedValue(total)
  }

  describe('create', () => {
    it('quando ainda há vaga concedida, cria a bolsa', async () => {
      withAllocatedSlots(3)

      await service.create(VALID_DTO)

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          agency_id: AGENCY.id,
          allocation_id: ALLOCATION.id,
          enrollment_id: ENROLLMENT.id
        })
      )
    })

    it('quando a agência concedeu 13 vagas e todas estão ocupadas, bloqueia a 14ª bolsa e não salva', async () => {
      withAllocatedSlots(13)

      await expect(service.create(VALID_DTO)).rejects.toBeInstanceOf(
        BadRequestException
      )
      expect(repository.create).not.toHaveBeenCalled()
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

      repository.countAllocatedSlots
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /A alocação REMOTO/
      )
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando a matrícula já tem bolsa vigente, recusa cadastrar outra', async () => {
      withAllocatedSlots(3)
      repository.countOccupyingSlotByEnrollment.mockResolvedValue(1)

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /já possui uma bolsa vigente/
      )
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando a matrícula não tem bolsa vigente, deixa cadastrar', async () => {
      withAllocatedSlots(3)
      repository.countOccupyingSlotByEnrollment.mockResolvedValue(0)

      await service.create(VALID_DTO)

      expect(repository.create).toHaveBeenCalled()
    })

    it('quando a bolsa é cadastrada com o período já encerrado, não valida cota e salva', async () => {
      withAllocatedSlots(13)

      await service.create({
        ...(VALID_DTO as object),
        scholarship_starts_at: daysFromToday(-365),
        scholarship_ends_at: daysFromToday(-1)
      } as never)

      expect(repository.create).toHaveBeenCalled()
    })

    it('quando a bolsa é cadastrada para começar no futuro, valida cota mesmo sem ter começado', async () => {
      withAllocatedSlots(13)

      await expect(
        service.create({
          ...(VALID_DTO as object),
          ...notStartedScholarship()
        } as never)
      ).rejects.toThrow(/já alocada/)
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando já existe bolsa com os mesmos dados, recusa a criação', async () => {
      repository.findDuplicateForCreate.mockResolvedValue({ id: 1 })

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
      expect(repository.create).not.toHaveBeenCalled()
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
      repository.findByIdAndEnrollmentId.mockResolvedValue(EXISTING)
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
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a bolsa é atualizada, exclui a própria bolsa da contagem de vagas ocupadas', async () => {
      withAllocatedSlots(2)

      await service.update(900, UPDATE_DTO)

      expect(repository.countAllocatedSlots).toHaveBeenCalledWith(
        expect.objectContaining({ excludingScholarshipId: EXISTING.id })
      )
      expect(repository.update).toHaveBeenCalled()
    })

    it('quando a bolsa passa a ter o período encerrado, não valida cota e salva', async () => {
      withAllocatedSlots(13)

      await service.update(900, {
        ...(UPDATE_DTO as object),
        scholarship_starts_at: daysFromToday(-365),
        scholarship_ends_at: daysFromToday(-1)
      } as never)

      expect(agencyService.findOneById).not.toHaveBeenCalled()
      expect(repository.update).toHaveBeenCalled()
    })

    it('quando o PATCH não informa a prorrogação, preserva a data que já estava gravada', async () => {
      const extended = makeScholarship({ id: 900, ...extendedScholarship() })
      repository.findByIdAndEnrollmentId.mockResolvedValue(extended)
      withAllocatedSlots(0)

      await service.update(900, UPDATE_DTO)

      expect(repository.update).toHaveBeenCalledWith(
        900,
        expect.objectContaining({
          extension_ends_at: extended.extension_ends_at
        })
      )
    })

    it('quando já existe bolsa idêntica, recusa a atualização', async () => {
      repository.findDuplicateForUpdate.mockResolvedValue({ id: 1 })

      await expect(service.update(900, UPDATE_DTO)).rejects.toThrow(
        /Já existe uma bolsa/
      )
      expect(repository.update).not.toHaveBeenCalled()
    })
  })

  describe('relatórios', () => {
    it('as duas contagens por ano usam a mesma consulta, com e sem filtro de agência', async () => {
      await service.countScholarshipsGroupingByCourseAndYear()
      await service.countScholarshipsGroupingByCourseAndYearFilteringByAgencyName(
        'CAPES'
      )

      expect(repository.countByProgramAndYear).toHaveBeenNthCalledWith(
        1,
        undefined
      )
      expect(repository.countByProgramAndYear).toHaveBeenNthCalledWith(
        2,
        'CAPES'
      )
    })

    it('as contagens por agência diferem apenas no status pedido', async () => {
      await service.countOnGoingScholarshipsGroupingByAgencyForCourse(
        'MESTRADO'
      )
      await service.countFinishedScholarshipsGroupingByAgencyForCourse(
        'MESTRADO'
      )

      const [primeira, segunda] =
        repository.countByAgencyForProgramAndStatus.mock.calls
      expect(primeira[0]).toBe('MESTRADO')
      expect(segunda[0]).toBe('MESTRADO')
      expect(primeira[1]).not.toBe(segunda[1])
    })
  })

  describe('findScholarshipsForReport', () => {
    it('para a integração externa, repassa os filtros informados ao repositório', async () => {
      await service.findScholarshipsForReport({
        start_period: '2024-01-01',
        end_period: '2024-12-31',
        enrollment_number: '2023102480'
      })

      expect(repository.findAllForReport).toHaveBeenCalledWith({
        startDay: '2024-01-01',
        endDay: '2024-12-31',
        enrollmentNumber: '2023102480'
      })
    })

    it.each<[FindScholarshipsForReportDto, string]>([
      [{}, 'sem nenhum filtro'],
      [{ start_period: '2024-12-31' }, 'só o início'],
      [{ end_period: '2024-01-01' }, 'só o fim'],
      [{ enrollment_number: '2023102480' }, 'só a matrícula']
    ])(
      'sem o período completo, não compara as datas e consulta o banco (%o, %s)',
      async (dto) => {
        await service.findScholarshipsForReport(dto)

        expect(repository.findAllForReport).toHaveBeenCalledTimes(1)
      }
    )

    it.each([
      ['2024-12-31', '2024-01-01', 'data final antes da inicial'],
      ['2024-06-01', '2024-06-01', 'datas iguais']
    ])(
      'quando start_period não é menor que end_period, rejeita sem consultar o banco (%s, %s: %s)',
      async (start_period, end_period) => {
        await expect(
          service.findScholarshipsForReport({
            start_period,
            end_period
          })
        ).rejects.toBeInstanceOf(BadRequestException)

        expect(repository.findAllForReport).not.toHaveBeenCalled()
      }
    )
  })
})
