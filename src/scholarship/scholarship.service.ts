import { Injectable, Logger } from '@nestjs/common'
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common/exceptions'
import { IPaginationOptions } from 'nestjs-typeorm-paginate'
import { PageDto } from '@/common/pagination/page.dto'
import { PageMetaDto } from '@/common/pagination/page-meta.dto'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { constants } from '@/common/utils/constants'
import { ScholarshipMapper } from './scholarship.mapper'
import { ScholarshipFilters } from './scholarship-filters.interface'
import { ScholarshipRepository } from '@/scholarship/repositories/scholarship.repository'
import { StudentService } from '@/student/student.service'
import { AgencyService } from '@/agency/agency.service'
import { AllocationService } from '@/allocation/allocation.service'
import { EnrollmentService } from '@/enrollment/enrollment.service'
import { CreateScholarshipDto } from '@/scholarship/dtos/create-scholarship.dto'
import { UpdateScholarshipDto } from '@/scholarship/dtos/update-scholarship.dto'
import { validateScholarshipDuration } from '@/common/utils/date.util'
import { CountScholarshipsAsReportBetweenDatesDto } from '@/scholarship/dtos/count-scholarship-courses-between-dates.dto'
import { ProgramEnum } from '@/common/enums/program.enum'
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
import { ProcessedScholarship } from '@/data-manager/update-scholarship-csv.util'

interface QuotaTarget {
  type: 'agency' | 'allocation'
  id: number
  name: string
  masters_degree_awarded_scholarships?: number
  doctorate_degree_awarded_scholarships?: number
}

@Injectable()
export class ScholarshipService {
  private readonly logger = new Logger(ScholarshipService.name)

  constructor(
    private readonly scholarshipRepository: ScholarshipRepository,
    private agencyService: AgencyService,
    private allocationService: AllocationService,
    private enrollmentService: EnrollmentService,
    private studentService: StudentService
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

    this.logger.warn(
      constants.exceptionMessages.scholarship.ENROLLMENT_ALREADY_HAS_ACTIVE
    )

    throw new BadRequestException(
      constants.exceptionMessages.scholarship.ENROLLMENT_ALREADY_HAS_ACTIVE
    )
  }

  private async assertHasAvailableSlot(
    target: QuotaTarget,
    enrollment: { id: number; program: string },
    excludingScholarshipId?: number
  ): Promise<void> {
    const awardedSlots = getAwardedSlotsByProgram(target, enrollment.program)

    const allocatedSlots = await this.scholarshipRepository.countAllocatedSlots(
      {
        program: enrollment.program,
        agencyId: target.type === 'agency' ? target.id : undefined,
        allocationId: target.type === 'allocation' ? target.id : undefined,
        excludingScholarshipId
      }
    )

    if (hasAvailableSlot({ awardedSlots, allocatedSlots })) return

    const scope = target.type === 'agency' ? 'A agência' : 'A alocação'
    const program = ProgramEnum[enrollment.program] || enrollment.program
    const message =
      awardedSlots <= 0
        ? `${constants.exceptionMessages.scholarship.QUOTA_NOT_CONFIGURED} ` +
          `${scope} ${target.name} não possui vagas de ${program} concedidas.`
        : `${constants.exceptionMessages.scholarship.NO_SLOTS_AVAILABLE} ` +
          `${scope} ${target.name} possui ${awardedSlots} vaga(s) de ${program} ` +
          `concedida(s) e ${allocatedSlots} já alocada(s).`

    this.logger.warn(message)

    throw new BadRequestException(message)
  }

  private async assertScholarshipFitsInAvailableSlots(params: {
    agency?: QuotaTarget | null
    allocation?: QuotaTarget | null
    enrollment: { id: number; enrollment_program: string }
    excludingScholarshipId?: number
  }): Promise<void> {
    const enrollment = {
      id: params.enrollment.id,
      program: params.enrollment.enrollment_program
    }

    if (params.agency) {
      await this.assertHasAvailableSlot(
        { ...params.agency, type: 'agency' },
        enrollment,
        params.excludingScholarshipId
      )
    }

    if (params.allocation) {
      await this.assertHasAvailableSlot(
        { ...params.allocation, type: 'allocation' },
        enrollment,
        params.excludingScholarshipId
      )
    }
  }

  async create(dto: CreateScholarshipDto): Promise<Scholarship> {
    this.logger.log(constants.exceptionMessages.scholarship.CREATION_STARTED)
    try {
      const agency = await this.agencyService.findOneByName(dto.agency_name)
      const allocation = await this.allocationService.findOneByName(
        dto.allocation_name
      )
      const enrollment =
        await this.enrollmentService.findOneByStudentEmailAndEnrollmentNumber(
          dto.student_email,
          dto.enrollment_number
        )

      const scholarship =
        await this.scholarshipRepository.findDuplicateForCreate({
          enrollment_id: enrollment.id,
          agency_id: agency.id,
          allocation_id: allocation.id,
          salary: dto.salary,
          scholarship_starts_at: dto.scholarship_starts_at,
          scholarship_ends_at: dto.scholarship_ends_at
        })

      if (scholarship) {
        this.logger.warn(
          constants.exceptionMessages.scholarship.ALREADY_REGISTERED
        )

        throw new BadRequestException(
          constants.exceptionMessages.scholarship.ALREADY_REGISTERED
        )
      }

      const isValidEndDate = validateScholarshipDuration(
        {
          givenDate: dto.scholarship_ends_at,
          referenceDate: dto.scholarship_starts_at
        },
        enrollment
      )
      if (!isValidEndDate.isValid) {
        this.logger.warn(isValidEndDate.errorMessage)

        throw new BadRequestException(isValidEndDate.errorMessage)
      }

      const willOccupySlot = occupiesSlot({
        scholarship_starts_at: dto.scholarship_starts_at,
        scholarship_ends_at: dto.scholarship_ends_at,
        extension_ends_at: dto.extension_ends_at
      })

      if (willOccupySlot) {
        await this.assertEnrollmentHasNoActiveScholarship(enrollment.id)

        await this.assertScholarshipFitsInAvailableSlots({
          agency: { ...agency, type: 'agency' },
          allocation: allocation ? { ...allocation, type: 'allocation' } : null,
          enrollment
        })
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

      this.logger.log(
        constants.exceptionMessages.scholarship.CREATION_COMPLETED
      )

      return newScholarship
    } catch (error: any) {
      this.logger.error(
        constants.exceptionMessages.scholarship.CREATION_FAILED,
        error,
        error.message,
        `Student Email: ${dto.student_email}`,
        `Enrollment Number: ${dto.enrollment_number}`,
        `Agency Name: ${dto.agency_name}`,
        `Allocation Name: ${dto.allocation_name}`
      )
      throw new BadRequestException(
        error.message
          ? error.message
          : error.response.message
          ? error.response.message
          : constants.exceptionMessages.scholarship.CREATION_FAILED
      )
    }
  }

  async update(id: number, dto: UpdateScholarshipDto) {
    try {
      const student = await this.studentService.findByEmail(dto.student_email)

      const enrollment = await this.enrollmentService.findOneByIdAndStudentId(
        dto.enrollment_id,
        student.id
      )

      const idempotencyScholarship =
        await this.scholarshipRepository.findDuplicateForUpdate({
          enrollment_id: enrollment.id,
          agency_id: dto.agency_id,
          allocation_id: dto.allocation_id,
          salary: dto.salary,
          scholarship_starts_at: dto.scholarship_starts_at,
          scholarship_ends_at: dto.scholarship_ends_at,
          extension_ends_at: dto.extension_ends_at
        })

      if (idempotencyScholarship) {
        this.logger.warn(
          constants.exceptionMessages.scholarship.ALREADY_REGISTERED
        )

        throw new BadRequestException(
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

      const isValidEndDate = validateScholarshipDuration(
        {
          givenDate: dto.scholarship_ends_at,
          referenceDate: dto.scholarship_starts_at
        },
        enrollment
      )
      if (!isValidEndDate.isValid) {
        this.logger.warn(isValidEndDate.errorMessage)

        throw new BadRequestException(isValidEndDate.errorMessage)
      }

      const isValidExtensionDate = dto.extension_ends_at
        ? validateScholarshipDuration(
            {
              givenDate: dto.extension_ends_at,
              referenceDate: dto.scholarship_ends_at
            },
            enrollment,
            true
          )
        : { isValid: true, errorMessage: '' }
      if (!isValidExtensionDate.isValid) {
        this.logger.warn(isValidExtensionDate.errorMessage)

        throw new BadRequestException(isValidExtensionDate.errorMessage)
      }

      const nextExtensionEndsAt =
        dto.extension_ends_at ?? scholarship.extension_ends_at
      const nextStartsAt =
        dto.scholarship_starts_at || scholarship.scholarship_starts_at
      const nextEndsAt =
        dto.scholarship_ends_at || scholarship.scholarship_ends_at

      const willOccupySlot = occupiesSlot({
        scholarship_starts_at: nextStartsAt,
        scholarship_ends_at: nextEndsAt,
        extension_ends_at: nextExtensionEndsAt
      })

      if (willOccupySlot) {
        const nextAgencyId = dto.agency_id || scholarship.agency_id
        const nextAllocationId = dto.allocation_id || scholarship.allocation_id

        const nextAgency = await this.agencyService.findOneById(nextAgencyId)
        const nextAllocation = nextAllocationId
          ? await this.allocationService.findOneById(nextAllocationId)
          : null

        await this.assertScholarshipFitsInAvailableSlots({
          agency: nextAgency ? { ...nextAgency, type: 'agency' } : null,
          allocation: nextAllocation
            ? { ...nextAllocation, type: 'allocation' }
            : null,
          enrollment,
          excludingScholarshipId: scholarship.id
        })
      }

      return await this.scholarshipRepository.update(scholarship.id, {
        salary: dto.salary,
        extension_ends_at: nextExtensionEndsAt,
        agency_id: dto.agency_id || scholarship.agency_id,
        allocation_id: dto.allocation_id || scholarship.allocation_id,
        scholarship_starts_at: nextStartsAt,
        scholarship_ends_at: nextEndsAt
      })
    } catch (error: any) {
      throw new BadRequestException(
        error.message
          ? error.message
          : error.response.message
          ? error.response.message
          : constants.exceptionMessages.scholarship.UPDATE_FAILED
      )
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

  async deleteAll() {
    this.logger.warn(constants.exceptionMessages.scholarship.DELETE_ALL_STARTED)
    await this.scholarshipRepository.deleteAllAndResetSequence()
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
    try {
      return await this.scholarshipRepository.countByProgramAndYear(agencyName)
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
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
    try {
      return await this.scholarshipRepository.countByAgencyForProgramAndStatus(
        programName,
        status
      )
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async countScholarshipsGroupingByStatusForAgency(agencyName: string) {
    try {
      return await this.scholarshipRepository.countByStatusForAgency(agencyName)
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async countScholarshipsAsReportBetweenDates(
    dto: CountScholarshipsAsReportBetweenDatesDto
  ) {
    try {
      return await this.scholarshipRepository.countAsReportBetweenDates(dto)
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async copyFilteredScholarshipsStudentsEmails(
    filters: ScholarshipFilters
  ): Promise<string[]> {
    try {
      return await this.scholarshipRepository.findDistinctStudentEmails(filters)
    } catch (error) {
      throw new InternalServerErrorException('Falha ao gerar lista de e-mails.')
    }
  }

  async findForUpdate(
    scholarship: ProcessedScholarship
  ): Promise<Partial<Scholarship>> {
    return await this.scholarshipRepository.findMatchForCsvUpdate({
      program: scholarship.enrollment.enrollment_program,
      agencyName: scholarship.agency,
      studentName: scholarship.student.name
    })
  }
}
