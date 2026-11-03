import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { isBefore, parse } from 'date-fns'
import { IPaginationOptions } from 'nestjs-typeorm-paginate'
import { PageDto } from '@/common/pagination/page.dto'
import { PageMetaDto } from '@/common/pagination/page-meta.dto'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { constants } from '@/common/utils/constants'
import { ScholarshipMapper } from './scholarship.mapper'
import { ScholarshipFilters } from './scholarship-filters.interface'
import { ScholarshipRepository } from '@/scholarship/repositories/scholarship.repository'
import { UserRepository } from '@/user/repositories/user.repository'
import { findStudentByEmail } from '@/user/user-lookup.util'
import { AgencyService } from '@/agency/agency.service'
import { AllocationService } from '@/allocation/allocation.service'
import { EnrollmentService } from '@/enrollment/enrollment.service'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { CreateScholarshipDto } from '@/scholarship/dtos/create-scholarship.dto'
import { UpdateScholarshipDto } from '@/scholarship/dtos/update-scholarship.dto'
import { validateScholarshipDuration } from '@/common/utils/date.util'
import {
  toCalendarDay,
  type CalendarDay
} from '@/common/utils/calendar-day.util'
import { CountScholarshipsAsReportBetweenDatesDto } from '@/scholarship/dtos/count-scholarship-courses-between-dates.dto'
import { FindScholarshipsForReportDto } from '@/scholarship/dtos/find-scholarships-for-report.dto'
import { ProgramEnum } from '@/common/enums/program.enum'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { User } from '@/user/entities/user.entity'
import {
  describeExceededDuration,
  exceedsExpectedDuration
} from '@/scholarship/utils/scholarship-duration.util'
import {
  getAwardedSlotsByProgram,
  hasAvailableSlot
} from '@/scholarship/utils/scholarship-allocation.util'
import {
  occupiesSlot,
  todayAsCalendarDay,
  ScholarshipStatus,
  ScholarshipStatusEnum,
  SCHOLARSHIP_STATUSES
} from '@/scholarship/utils/scholarship-status.util'

interface AgencyQuota {
  id: number
  name: string
  masters_degree_awarded_scholarships?: number
  doctorate_degree_awarded_scholarships?: number
}

const DURATION_EXCEEDED_TITLE = 'Bolsa com duração acima do esperado'

@Injectable()
export class ScholarshipService {
  private readonly logger = new Logger(ScholarshipService.name)

  constructor(
    private readonly scholarshipRepository: ScholarshipRepository,
    private agencyService: AgencyService,
    private allocationService: AllocationService,
    private enrollmentService: EnrollmentService,
    private readonly userRepository: UserRepository,
    private readonly embedNotificationRepository: EmbedNotificationRepository
  ) {}

  async findAll(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.findAllWithRelations()
  }

  async findAllForFilter(): Promise<{ status: string }[]> {
    return SCHOLARSHIP_STATUSES.map((status) => ({ status }))
  }

  async findAllPaginated(
    paginateOptions: IPaginationOptions,
    filters: ScholarshipFilters
  ) {
    const { items, meta } = await this.scholarshipRepository.findPaginated(
      filters,
      paginateOptions
    )

    const itemsDto = items.map((scholarship) =>
      ScholarshipMapper.detailedWithRelations(scholarship)
    )

    const metaDto = new PageMetaDto(
      meta.totalItems,
      meta.itemCount,
      meta.itemsPerPage,
      meta.totalPages,
      meta.currentPage
    )

    return new PageDto(itemsDto, metaDto)
  }

  async findAllForNotification(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.findAllOccupyingSlot()
  }

  async findAllEndingOn(
    referenceDay: string = todayAsCalendarDay()
  ): Promise<Scholarship[]> {
    return await this.scholarshipRepository.findAllEndingOn(referenceDay)
  }

  private async assertEnrollmentHasNoActiveScholarship(
    enrollmentId: number
  ): Promise<void> {
    const activeScholarships =
      await this.scholarshipRepository.countOccupyingSlotByEnrollment(
        enrollmentId
      )

    if (activeScholarships === 0) return

    throw new BadRequestException(
      constants.exceptionMessages.scholarship.ENROLLMENT_ALREADY_HAS_ACTIVE
    )
  }

  private async assertAgencyHasAvailableSlot(
    agency: AgencyQuota,
    enrollment: { enrollment_program: string },
    excludingScholarshipId?: number
  ): Promise<void> {
    const program = enrollment.enrollment_program
    const awardedSlots = getAwardedSlotsByProgram(agency, program)

    const allocatedSlots = await this.scholarshipRepository.countAllocatedSlots(
      {
        program,
        agencyId: agency.id,
        excludingScholarshipId
      }
    )

    if (hasAvailableSlot({ awardedSlots, allocatedSlots })) return

    const programLabel = ProgramEnum[program] || program
    const message =
      awardedSlots <= 0
        ? `${constants.exceptionMessages.scholarship.QUOTA_NOT_CONFIGURED} ` +
          `A agência ${agency.name} não possui vagas de ${programLabel} concedidas.`
        : `${constants.exceptionMessages.scholarship.NO_SLOTS_AVAILABLE} ` +
          `A agência ${agency.name} possui ${awardedSlots} vaga(s) de ${programLabel} ` +
          `concedida(s) e ${allocatedSlots} já alocada(s).`

    throw new BadRequestException(message)
  }

  /**
   * O término não tem limite de duração: período acima do esperado para o
   * curso só gera aviso (no front) e notificação aos administradores. Só
   * término antes do início é recusado.
   */
  private assertValidPeriod(
    period: {
      scholarship_starts_at: CalendarDay
      scholarship_ends_at: CalendarDay
      extension_ends_at?: CalendarDay | null
    },
    enrollment: Partial<Enrollment>
  ): void {
    if (
      toCalendarDay(period.scholarship_ends_at) <
      toCalendarDay(period.scholarship_starts_at)
    ) {
      throw new BadRequestException(
        constants.exceptionMessages.dates.END_DATE_SMALLER
      )
    }

    if (!period.extension_ends_at) return

    const extensionDate = validateScholarshipDuration(
      {
        givenDate: period.extension_ends_at,
        referenceDate: period.scholarship_ends_at
      },
      enrollment,
      true
    )
    if (!extensionDate.isValid) {
      throw new BadRequestException(extensionDate.errorMessage)
    }
  }

  async create(dto: CreateScholarshipDto): Promise<Scholarship> {
    const agency = await this.agencyService.findOneByName(dto.agency_name)
    const allocation = await this.allocationService.findOneByName(
      dto.allocation_name
    )
    const enrollment =
      await this.enrollmentService.findOneByStudentEmailAndEnrollmentNumber(
        dto.student_email,
        dto.enrollment_number
      )

    const scholarship = await this.scholarshipRepository.findDuplicateForCreate(
      {
        enrollment_id: enrollment.id,
        agency_id: agency.id,
        allocation_id: allocation.id,
        salary: dto.salary,
        scholarship_starts_at: dto.scholarship_starts_at,
        scholarship_ends_at: dto.scholarship_ends_at
      }
    )

    if (scholarship) {
      throw new ConflictException(
        constants.exceptionMessages.scholarship.ALREADY_REGISTERED
      )
    }

    this.assertValidPeriod(
      {
        scholarship_starts_at: dto.scholarship_starts_at,
        scholarship_ends_at: dto.scholarship_ends_at,
        extension_ends_at: dto.extension_ends_at
      },
      enrollment
    )

    const willOccupySlot = occupiesSlot({
      scholarship_starts_at: dto.scholarship_starts_at,
      scholarship_ends_at: dto.scholarship_ends_at,
      extension_ends_at: dto.extension_ends_at
    })

    if (willOccupySlot) {
      await this.assertEnrollmentHasNoActiveScholarship(enrollment.id)

      await this.assertAgencyHasAvailableSlot(agency, enrollment)
    }

    const newScholarship = await this.scholarshipRepository.create({
      agency_id: agency.id,
      allocation_id: allocation.id,
      enrollment_id: enrollment.id,
      scholarship_starts_at: dto.scholarship_starts_at,
      scholarship_ends_at: dto.scholarship_ends_at,
      extension_ends_at: dto.extension_ends_at,
      salary: dto.salary
    })

    this.logger.log(constants.exceptionMessages.scholarship.CREATION_COMPLETED)

    await this.notifyAdminsIfDurationExceeded(
      {
        scholarship_starts_at: dto.scholarship_starts_at,
        scholarship_ends_at: dto.scholarship_ends_at
      },
      enrollment,
      () => this.userRepository.findByEmail(dto.student_email, 'STUDENT')
    )

    return newScholarship
  }

  async update(id: number, dto: UpdateScholarshipDto) {
    const student = await findStudentByEmail(
      this.userRepository,
      dto.student_email
    )

    const enrollment = await this.enrollmentService.findOneByIdAndStudentId(
      dto.enrollment_id,
      student.id
    )

    const idempotencyScholarship =
      await this.scholarshipRepository.findDuplicateForUpdate({
        exclude_id: id,
        enrollment_id: enrollment.id,
        agency_id: dto.agency_id,
        allocation_id: dto.allocation_id,
        salary: dto.salary,
        scholarship_starts_at: dto.scholarship_starts_at,
        scholarship_ends_at: dto.scholarship_ends_at,
        extension_ends_at: dto.extension_ends_at
      })

    if (idempotencyScholarship) {
      throw new ConflictException(
        constants.exceptionMessages.scholarship.ALREADY_REGISTERED
      )
    }

    const scholarship =
      await this.scholarshipRepository.findByIdAndEnrollmentId(
        id,
        enrollment.id
      )

    if (!scholarship) {
      throw new NotFoundException(
        constants.exceptionMessages.scholarship.NOT_FOUND
      )
    }

    const nextExtensionEndsAt =
      dto.extension_ends_at === undefined
        ? scholarship.extension_ends_at
        : dto.extension_ends_at
    const nextStartsAt =
      dto.scholarship_starts_at || scholarship.scholarship_starts_at
    const nextEndsAt =
      dto.scholarship_ends_at || scholarship.scholarship_ends_at

    this.assertValidPeriod(
      {
        scholarship_starts_at: nextStartsAt,
        scholarship_ends_at: nextEndsAt,
        extension_ends_at: nextExtensionEndsAt
      },
      enrollment
    )

    const willOccupySlot = occupiesSlot({
      scholarship_starts_at: nextStartsAt,
      scholarship_ends_at: nextEndsAt,
      extension_ends_at: nextExtensionEndsAt
    })

    if (willOccupySlot) {
      const nextAgency = await this.agencyService.findOneById(
        dto.agency_id || scholarship.agency_id
      )

      await this.assertAgencyHasAvailableSlot(
        nextAgency,
        enrollment,
        scholarship.id
      )
    }

    const updated = await this.scholarshipRepository.update(scholarship.id, {
      salary: dto.salary,
      extension_ends_at: nextExtensionEndsAt,
      agency_id: dto.agency_id || scholarship.agency_id,
      allocation_id: dto.allocation_id || scholarship.allocation_id,
      scholarship_starts_at: nextStartsAt,
      scholarship_ends_at: nextEndsAt
    })

    // Editar outro campo de uma bolsa que já passava do esperado não notifica de novo.
    const periodChanged =
      toCalendarDay(nextStartsAt) !==
        toCalendarDay(scholarship.scholarship_starts_at) ||
      toCalendarDay(nextEndsAt) !==
        toCalendarDay(scholarship.scholarship_ends_at)

    if (periodChanged) {
      await this.notifyAdminsIfDurationExceeded(
        {
          scholarship_starts_at: nextStartsAt,
          scholarship_ends_at: nextEndsAt
        },
        enrollment,
        async () => student
      )
    }

    return updated
  }

  /**
   * A bolsa já foi gravada: uma falha ao notificar não deve desfazer o
   * salvamento nem devolver erro.
   */
  private async notifyAdminsIfDurationExceeded(
    period: {
      scholarship_starts_at: CalendarDay
      scholarship_ends_at: CalendarDay
    },
    enrollment: Partial<Enrollment>,
    findStudent: () => Promise<User | null>
  ): Promise<void> {
    const startsAt = toCalendarDay(period.scholarship_starts_at)
    const endsAt = toCalendarDay(period.scholarship_ends_at)
    const program = enrollment.enrollment_program ?? ''
    if (!exceedsExpectedDuration(startsAt, endsAt, program)) return

    try {
      const student = await findStudent()
      const description = describeExceededDuration({
        studentName: student?.name ?? 'estudante',
        program,
        startsAt,
        endsAt
      })
      const admins = (await this.userRepository.findAllByType('ADMIN')).filter(
        (admin) => admin.status === 'ACTIVE'
      )

      for (const admin of admins) {
        await this.embedNotificationRepository.create({
          owner_id: admin.id,
          owner_type: 'ADMIN',
          title: DURATION_EXCEEDED_TITLE,
          description
        })
      }
    } catch (error) {
      this.logger.error(
        'Exceeded duration notification failed',
        error instanceof Error ? error.stack : String(error)
      )
    }
  }

  async findOneWithRelations(id: number): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepository.findByIdWithRelations(
      id
    )

    if (!scholarship) {
      throw new NotFoundException(
        constants.exceptionMessages.scholarship.NOT_FOUND
      )
    }

    return scholarship
  }

  /**
   * Bolsas das matrículas em que o usuário é o estudante ou o orientador.
   * Administrador não tem matrícula, então a lista dele é vazia.
   */
  async findAllByUser(userId: number): Promise<Scholarship[]> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
    }

    switch (user.role) {
      case 'STUDENT':
        return await this.scholarshipRepository.findAllByOwner({
          student_id: user.id
        })
      case 'ADVISOR':
        return await this.scholarshipRepository.findAllByOwner({
          advisor_id: user.id
        })
      default:
        return []
    }
  }

  async delete(id: number): Promise<boolean> {
    const affected = await this.scholarshipRepository.deleteById(id)
    if (affected === 1) {
      return true
    }

    throw new NotFoundException(
      constants.exceptionMessages.scholarship.NOT_FOUND
    )
  }

  async countScholarshipsGroupingByCourseAndYear() {
    return await this.countByProgramAndYear()
  }

  async countScholarshipsGroupingByCourseAndYearFilteringByAgencyName(
    agencyName: string
  ) {
    return await this.countByProgramAndYear(agencyName)
  }

  private async countByProgramAndYear(agencyName?: string) {
    return await this.scholarshipRepository.countByProgramAndYear(agencyName)
  }

  async countOnGoingScholarshipsGroupingByAgencyForCourse(programName: string) {
    return await this.countByAgencyForProgramAndStatus(
      programName,
      ScholarshipStatusEnum.ON_GOING
    )
  }

  async countFinishedScholarshipsGroupingByAgencyForCourse(
    programName: string
  ) {
    return await this.countByAgencyForProgramAndStatus(
      programName,
      ScholarshipStatusEnum.FINISHED
    )
  }

  private async countByAgencyForProgramAndStatus(
    programName: string,
    status: ScholarshipStatus
  ) {
    return await this.scholarshipRepository.countByAgencyForProgramAndStatus(
      programName,
      status
    )
  }

  async countScholarshipsGroupingByStatusForAgency(agencyName: string) {
    return await this.scholarshipRepository.countByStatusForAgency(agencyName)
  }

  async countScholarshipsAsReportBetweenDates(
    dto: CountScholarshipsAsReportBetweenDatesDto
  ) {
    return await this.scholarshipRepository.countAsReportBetweenDates(dto)
  }

  async findScholarshipsForReport(dto: FindScholarshipsForReportDto) {
    if (dto.start_period && dto.end_period) {
      const startDay = parse(dto.start_period, 'yyyy-MM-dd', new Date())
      const endDay = parse(dto.end_period, 'yyyy-MM-dd', new Date())

      if (!isBefore(startDay, endDay)) {
        throw new BadRequestException(
          'O parâmetro start_period deve ser menor que end_period.'
        )
      }
    }

    return await this.scholarshipRepository.findAllForReport({
      startDay: dto.start_period,
      endDay: dto.end_period,
      enrollmentNumber: dto.enrollment_number
    })
  }

  async copyFilteredScholarshipsStudentsEmails(
    filters: ScholarshipFilters
  ): Promise<string[]> {
    return await this.scholarshipRepository.findDistinctStudentEmails(filters)
  }
}
