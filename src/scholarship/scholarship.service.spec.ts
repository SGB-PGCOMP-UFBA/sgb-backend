import {
  BadRequestException,
  ConflictException,
  NotFoundException
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  notStartedScholarship,
  extendedScholarship,
  daysFromToday,
  makeAdmin,
  makeAdvisor,
  makeAgency,
  makeAllocation,
  makeEnrollment,
  makeScholarship,
  makeStudent
} from '@/common/testing/factories'
import { ScholarshipRepository } from '@/scholarship/repositories/scholarship.repository'
import { ScholarshipService } from './scholarship.service'
import { constants } from '@/common/utils/constants'
import { FindScholarshipsForReportDto } from '@/scholarship/dtos/find-scholarships-for-report.dto'

const AGENCY = makeAgency()

const ALLOCATION = makeAllocation()

const ENROLLMENT = makeEnrollment()

const VALID_DTO = {
  student_email: 'aluno@ufba.br',
  enrollment_number: '2024123456',
  agency_name: 'CAPES',
  allocation_name: 'REMOTO',
  scholarship_starts_at: '2026-01-01',
  scholarship_ends_at: '2026-12-01'
} as never

function createScholarshipRepositoryMock() {
  return {
    findAllWithRelations: vi.fn().mockResolvedValue([]),
    findPaginated: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    findAllOccupyingSlot: vi.fn().mockResolvedValue([]),
    findAllEndingOn: vi.fn().mockResolvedValue([]),
    findAllEndingBetween: vi.fn().mockResolvedValue([]),
    findByIdWithRelations: vi.fn().mockResolvedValue(null),
    findAllByOwner: vi.fn().mockResolvedValue([]),
    findByIdAndEnrollmentId: vi.fn().mockResolvedValue(null),
    findDuplicateForCreate: vi.fn().mockResolvedValue(null),
    findDuplicateForUpdate: vi.fn().mockResolvedValue(null),
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
    deleteById: vi.fn().mockResolvedValue(1)
  } satisfies Record<keyof ScholarshipRepository, unknown>
}

describe('ScholarshipService', () => {
  let repository: ReturnType<typeof createScholarshipRepositoryMock>
  let agencyService: any
  let allocationService: any
  let enrollmentService: any
  let userRepository: {
    findByEmail: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }
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
    userRepository = {
      findByEmail: vi.fn().mockResolvedValue(makeStudent()),
      findById: vi.fn().mockResolvedValue(null)
    }

    service = new ScholarshipService(
      repository as unknown as ScholarshipRepository,
      agencyService,
      allocationService,
      enrollmentService,
      userRepository as never
    )
  })

  function withAllocatedSlots(total: number) {
    repository.countAllocatedSlots.mockResolvedValue(total)
  }

  describe('findOneWithRelations', () => {
    it('quando a bolsa existe, devolve com as relações carregadas', async () => {
      const scholarship = makeScholarship({ id: 5 })
      repository.findByIdWithRelations.mockResolvedValue(scholarship)

      await expect(service.findOneWithRelations(5)).resolves.toBe(scholarship)
      expect(repository.findByIdWithRelations).toHaveBeenCalledWith(5)
    })

    it('quando a bolsa não existe, responde 404', async () => {
      await expect(service.findOneWithRelations(99)).rejects.toThrow(
        new NotFoundException('Bolsa não encontrada.')
      )
    })
  })

  describe('findAllByUser', () => {
    it.each([
      ['estudante', makeStudent({ id: 7 }), { student_id: 7 }],
      ['orientador', makeAdvisor({ id: 10 }), { advisor_id: 10 }]
    ] as const)(
      'quando é %s, busca as bolsas das matrículas em que ele aparece',
      async (_label, user, owner) => {
        userRepository.findById.mockResolvedValue(user)

        await service.findAllByUser(user.id)

        expect(repository.findAllByOwner).toHaveBeenCalledWith(owner)
      }
    )

    it('quando é administrador, devolve lista vazia sem consultar bolsas', async () => {
      userRepository.findById.mockResolvedValue(makeAdmin({ id: 3 }))

      await expect(service.findAllByUser(3)).resolves.toEqual([])
      expect(repository.findAllByOwner).not.toHaveBeenCalled()
    })

    it('quando o usuário não existe, responde 404', async () => {
      await expect(service.findAllByUser(99)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado.')
      )
    })
  })

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
          scholarship_ends_at: '2025-01-01'
        } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando a prorrogação é anterior ao término, recusa a criação e não salva', async () => {
      withAllocatedSlots(0)

      await expect(
        service.create({
          ...(VALID_DTO as object),
          extension_ends_at: '2026-06-01'
        } as never)
      ).rejects.toThrow(
        new BadRequestException(
          constants.exceptionMessages.dates.EXTENSION_DATE_SMALLER
        )
      )
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando a prorrogação é posterior ao término, cria a bolsa com ela', async () => {
      withAllocatedSlots(0)

      await service.create({
        ...(VALID_DTO as object),
        extension_ends_at: '2027-06-01'
      } as never)

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ extension_ends_at: '2027-06-01' })
      )
    })

    it('quando o mestrado passa de 2 anos de duração, recusa a criação', async () => {
      withAllocatedSlots(0)

      await expect(
        service.create({
          ...(VALID_DTO as object),
          scholarship_ends_at: '2029-01-01'
        } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
    })
  })

  describe('update', () => {
    const UPDATE_DTO = {
      enrollment_id: ENROLLMENT.id,
      student_email: 'aluno@ufba.br',
      status: 'ON_GOING',
      scholarship_starts_at: '2026-01-01',
      scholarship_ends_at: '2026-12-01'
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

    it('quando o PATCH manda prorrogação nula, remove a prorrogação e a vigência volta ao término', async () => {
      repository.findByIdAndEnrollmentId.mockResolvedValue(
        makeScholarship({ id: 900, ...extendedScholarship() })
      )
      withAllocatedSlots(0)

      await service.update(900, {
        ...(UPDATE_DTO as object),
        extension_ends_at: null
      } as never)

      expect(repository.update).toHaveBeenCalledWith(
        900,
        expect.objectContaining({ extension_ends_at: null })
      )
    })

    it('quando o PATCH muda a prorrogação, grava a data nova', async () => {
      withAllocatedSlots(0)

      await service.update(900, {
        ...(UPDATE_DTO as object),
        extension_ends_at: '2027-03-01'
      } as never)

      expect(repository.update).toHaveBeenCalledWith(
        900,
        expect.objectContaining({ extension_ends_at: '2027-03-01' })
      )
    })

    it('quando a prorrogação enviada é anterior ao término, recusa e não salva', async () => {
      await expect(
        service.update(900, {
          ...(UPDATE_DTO as object),
          extension_ends_at: '2026-06-01'
        } as never)
      ).rejects.toThrow(
        new BadRequestException(
          constants.exceptionMessages.dates.EXTENSION_DATE_SMALLER
        )
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando só o término muda para depois da prorrogação já gravada, recusa e não salva', async () => {
      repository.findByIdAndEnrollmentId.mockResolvedValue(
        makeScholarship({
          id: 900,
          scholarship_starts_at: '2026-01-01',
          scholarship_ends_at: '2026-12-01',
          extension_ends_at: '2027-02-01'
        })
      )

      await expect(
        service.update(900, {
          enrollment_id: ENROLLMENT.id,
          student_email: 'aluno@ufba.br',
          scholarship_ends_at: '2027-06-01'
        } as never)
      ).rejects.toThrow(
        new BadRequestException(
          constants.exceptionMessages.dates.EXTENSION_DATE_SMALLER
        )
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando o PATCH não traz as datas, valida o período com as datas gravadas', async () => {
      repository.findByIdAndEnrollmentId.mockResolvedValue(
        makeScholarship({
          id: 900,
          scholarship_starts_at: '2026-01-01',
          scholarship_ends_at: '2026-12-01',
          extension_ends_at: '2027-02-01'
        })
      )
      withAllocatedSlots(0)

      await service.update(900, {
        enrollment_id: ENROLLMENT.id,
        student_email: 'aluno@ufba.br',
        salary: 2100
      } as never)

      expect(repository.update).toHaveBeenCalledWith(
        900,
        expect.objectContaining({
          scholarship_ends_at: '2026-12-01',
          extension_ends_at: '2027-02-01'
        })
      )
    })

    it('procura duplicata ignorando a própria bolsa', async () => {
      await service.update(900, UPDATE_DTO)

      expect(repository.findDuplicateForUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ exclude_id: 900 })
      )
    })

    it('quando já existe bolsa idêntica, recusa a atualização com conflito', async () => {
      repository.findDuplicateForUpdate.mockResolvedValue({ id: 1 })

      await expect(service.update(900, UPDATE_DTO)).rejects.toThrow(
        new ConflictException(
          'Já existe uma bolsa cadastrada com os mesmos detalhes informados.'
        )
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a bolsa não é da matrícula informada, responde 404 em vez de mascarar como 400', async () => {
      repository.findByIdAndEnrollmentId.mockResolvedValue(null)

      await expect(service.update(900, UPDATE_DTO)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })

    it('quando o banco falha, deixa o erro original subir sem copiar a mensagem dele', async () => {
      const failure = new Error('connection terminated unexpectedly')
      repository.update.mockRejectedValue(failure)

      await expect(service.update(900, UPDATE_DTO)).rejects.toBe(failure)
    })
  })

  describe('relatórios', () => {
    it('quando a consulta falha, deixa o erro subir para o filtro global registrar a causa', async () => {
      const failure = new Error('relation "scholarship" does not exist')
      repository.countByProgramAndYear.mockRejectedValue(failure)

      await expect(
        service.countScholarshipsGroupingByCourseAndYear()
      ).rejects.toBe(failure)
    })

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
