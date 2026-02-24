import { Injectable, Logger } from '@nestjs/common'
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common/exceptions'
import { InjectRepository } from '@nestjs/typeorm'
import {
  FindManyOptions,
  ILike,
  In,
  LessThanOrEqual,
  Like,
  Repository
} from 'typeorm'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { PageDto } from '../../../core/pagination/page.dto'
import { PageMetaDto } from '../../../core/pagination/page-meta.dto'
import { Scholarship } from '../entities/scholarship.entity'
import { constants } from '../../../core/utils/constants'
import { ScholarshipMapper } from '../mapper/scholarship.mapper'
import { ScholarshipFilters } from '../filters/IScholarshipFilters'
import { StudentService } from '../../../modules/student/service/student.service'
import { AgencyService } from '../../../modules/agency/service/agency.service'
import { AllocationService } from '../../../modules/allocation/service/allocation.service'
import { EnrollmentService } from '../../../modules/enrollment/services/enrollment.service'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { UpdateScholarshipDto } from '../dto/update-scholarship.dto'
import { validateScholarshipDuration } from '../../../core/utils/date-utils'
import { CountScholarshipsAsReportBetweenDatesDto } from '../dto/count-scholarship-courses-between-dates.dto'

const orderByMapping = {
  DAT_MATRICULA_ASC: ['enrollment', 'enrollment_date', 'ASC'],
  DAT_MATRICULA_DESC: ['enrollment', 'enrollment_date', 'DESC'],
  DAT_DEFESA_ASC: ['enrollment', 'defense_prediction_date', 'ASC'],
  DAT_DEFESA_DESC: ['enrollment', 'defense_prediction_date', 'DESC'],
  DAT_INICIO_ASC: ['scholarship', 'scholarship_starts_at', 'ASC'],
  DAT_INICIO_DESC: ['scholarship', 'scholarship_starts_at', 'DESC'],
  DAT_TERMINO_ASC: ['scholarship', 'scholarship_ends_at', 'ASC'],
  DAT_TERMINO_DESC: ['scholarship', 'scholarship_ends_at', 'DESC']
}

@Injectable()
export class ScholarshipService {
  private readonly logger = new Logger(ScholarshipService.name)

  constructor(
    @InjectRepository(Scholarship)
    private scholarshipRepository: Repository<Scholarship>,
    private agencyService: AgencyService,
    private allocationService: AllocationService,
    private enrollmentService: EnrollmentService,
    private studentService: StudentService
  ) {}

  async findAll(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.find({
      relations: [
        'agency',
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ]
    })
  }

  async findAllForFilter(): Promise<Scholarship[]> {
    const distinctScholarshipsStatus = await this.scholarshipRepository
      .createQueryBuilder('scholarship')
      .select('scholarship.status', 'status')
      .distinct(true)
      .orderBy('scholarship.status', 'ASC')
      .getRawMany()

    return distinctScholarshipsStatus
  }

  async findAllPaginated(
    paginateOptions: IPaginationOptions,
    filters: ScholarshipFilters
  ) {
    const findOptions: FindManyOptions<Scholarship> = {
      relations: [
        'agency',
        'allocation',
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ],
      where: {},
      order: {}
    }

    if (filters?.scholarshipStatus && filters?.scholarshipStatus !== 'ALL') {
      if (filters?.scholarshipStatus === 'ON_GOING') {
        findOptions.where['status'] = In(['ON_GOING', 'EXTENDED'])
      } else {
        findOptions.where['status'] = Like(`%${filters.scholarshipStatus}%`)
      }
    }
    if (filters?.agencyName && filters?.agencyName !== 'ALL') {
      findOptions.where['agency'] = {
        name: Like(`%${filters.agencyName}%`)
      }
    }
    if (filters?.allocationName && filters?.allocationName !== 'ALL') {
      findOptions.where['allocation'] = {
        name: Like(`%${filters.allocationName}%`)
      }
    }
    if (filters?.programName && filters?.programName !== 'ALL') {
      findOptions.where['enrollment'] = {
        enrollment_program: Like(`%${filters.programName}%`)
      }
    }
    if (filters?.advisorName && filters?.advisorName !== 'ALL') {
      if (!findOptions.where['enrollment']) {
        findOptions.where['enrollment'] = {}
      }

      findOptions.where['enrollment']['advisor'] = {
        name: Like(`%${filters.advisorName}%`)
      }
    }
    if (filters?.studentName && filters?.studentName !== '') {
      if (!findOptions.where['enrollment']) {
        findOptions.where['enrollment'] = {}
      }

      findOptions.where['enrollment']['student'] = {
        name: ILike(`%${filters.studentName}%`)
      }
    }
    if (filters?.orderBy && orderByMapping[filters.orderBy]) {
      const [table, field, order] = orderByMapping[filters.orderBy]
      if (table === 'enrollment') {
        findOptions.order[table] = {}
        findOptions.order[table][field] = order
      } else {
        findOptions.order[field] = order
      }
    }

    const scholarshipsPaginate = paginate<Scholarship>(
      this.scholarshipRepository,
      paginateOptions,
      findOptions
    )

    const items = (await scholarshipsPaginate).items
    const meta = (await scholarshipsPaginate).meta

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
    return await this.scholarshipRepository.find({
      relations: [
        'agency',
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ],
      where: {
        status: In(['ON_GOING', 'EXTENDED'])
      }
    })
  }

  async findAllEndingToday(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.find({
      relations: [
        'agency',
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ],
      where: [
        {
          status: In(['ON_GOING']),
          scholarship_ends_at: LessThanOrEqual(new Date())
        },
        {
          status: In(['EXTENDED']),
          extension_ends_at: LessThanOrEqual(new Date())
        }
      ]
    })
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

      const scholarship = await this.scholarshipRepository.findOneBy({
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

      const newScholarship = this.scholarshipRepository.create({
        agency_id: agency.id,
        allocation_id: allocation.id,
        enrollment_id: enrollment.id,
        scholarship_starts_at: dto.scholarship_starts_at,
        scholarship_ends_at: dto.scholarship_ends_at,
        extension_ends_at: dto.extension_ends_at,
        status: dto.status || 'ON_GOING',
        salary: dto.salary
      })

      await this.scholarshipRepository.save(newScholarship)

      this.logger.log(
        constants.exceptionMessages.scholarship.CREATION_COMPLETED
      )

      return newScholarship
    } catch (error) {
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

      const idempotencyScholarship = await this.scholarshipRepository.findOneBy(
        {
          enrollment_id: enrollment.id,
          agency: { id: dto.agency_id },
          allocation: { id: dto.allocation_id },
          salary: dto.salary,
          scholarship_starts_at: dto.scholarship_starts_at,
          scholarship_ends_at: dto.scholarship_ends_at,
          extension_ends_at: dto.extension_ends_at
        }
      )

      if (idempotencyScholarship) {
        this.logger.warn(
          constants.exceptionMessages.scholarship.ALREADY_REGISTERED
        )

        throw new BadRequestException(
          constants.exceptionMessages.scholarship.ALREADY_REGISTERED
        )
      }

      const scholarship = await this.scholarshipRepository.findOneBy({
        id: id,
        enrollment_id: enrollment.id
      })

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

      const updatedScholarship = await this.scholarshipRepository.save({
        id: scholarship.id,
        salary: dto.salary,
        extension_ends_at: dto.extension_ends_at,
        status: dto.status || scholarship.status,
        agency_id: dto.agency_id || scholarship.agency_id,
        allocation_id: dto.allocation_id || scholarship.allocation_id,
        scholarship_starts_at:
          dto.scholarship_starts_at || scholarship.scholarship_starts_at,
        scholarship_ends_at:
          dto.scholarship_ends_at || scholarship.scholarship_ends_at
      })

      return updatedScholarship
    } catch (error) {
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
    const removed = await this.scholarshipRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(
      constants.exceptionMessages.scholarship.NOT_FOUND
    )
  }

  async deleteAll() {
    this.logger.warn(constants.exceptionMessages.scholarship.DELETE_ALL_STARTED)
    await this.scholarshipRepository.createQueryBuilder().delete().execute()
    await this.scholarshipRepository.query(
      `ALTER SEQUENCE scholarship_id_seq RESTART WITH 1`
    )
  }

  async finishScholarship(id: number): Promise<void> {
    try {
      await this.scholarshipRepository.update(id, { status: 'FINISHED' })
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.FINISH_FAILED
      )
    }
  }

  async extendScholarship(id: number): Promise<void> {
    try {
      await this.scholarshipRepository.update(id, { status: 'EXTENDED' })
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.EXTEND_FAILED
      )
    }
  }

  async countScholarshipsGroupingByCourseAndYear() {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .select([
          `TO_CHAR(scholarship.scholarship_starts_at, 'YYYY') AS year`,
          `SUM(CASE WHEN enrollment.enrollment_program = 'MESTRADO' THEN 1 ELSE 0 END) AS masters_count`,
          `SUM(CASE WHEN enrollment.enrollment_program = 'DOUTORADO' THEN 1 ELSE 0 END) AS phd_count`
        ])
        .groupBy(`TO_CHAR(scholarship.scholarship_starts_at, 'YYYY')`)
        .orderBy(`TO_CHAR(scholarship.scholarship_starts_at, 'YYYY')`, 'ASC')
        .getRawMany()

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async countScholarshipsGroupingByCourseAndYearFilteringByAgencyName(
    agencyName: string
  ) {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .innerJoin('scholarship.agency', 'agency')
        .where('agency.name= :agencyName', { agencyName: agencyName })
        .select([
          `TO_CHAR(scholarship.scholarship_starts_at, 'YYYY') AS year`,
          `SUM(CASE WHEN enrollment.enrollment_program = 'MESTRADO' THEN 1 ELSE 0 END) AS masters_count`,
          `SUM(CASE WHEN enrollment.enrollment_program = 'DOUTORADO' THEN 1 ELSE 0 END) AS phd_count`
        ])
        .groupBy(`TO_CHAR(scholarship.scholarship_starts_at, 'YYYY')`)
        .orderBy(`TO_CHAR(scholarship.scholarship_starts_at, 'YYYY')`, 'ASC')
        .getRawMany()

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async countOnGoingScholarshipsGroupingByAgencyForCourse(programName: string) {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.agency', 'agency')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .where('scholarship.status IN (:...statuses)', {
          statuses: ['ON_GOING', 'EXTENDED']
        })
        .andWhere('enrollment.enrollment_program = :course', {
          course: programName
        })
        .select([
          'agency.name as agency_name',
          'enrollment.enrollment_program as course_name',
          'COUNT(scholarship.id) as count'
        ])
        .groupBy('agency.name, enrollment.enrollment_program')
        .orderBy('agency.name', 'ASC')
        .getRawMany()

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async countFinishedScholarshipsGroupingByAgencyForCourse(
    programName: string
  ) {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.agency', 'agency')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .where('scholarship.status IN (:...statuses)', {
          statuses: ['FINISHED']
        })
        .andWhere('enrollment.enrollment_program = :course', {
          course: programName
        })
        .select([
          'agency.name as agency_name',
          'enrollment.enrollment_program as course_name',
          'COUNT(scholarship.id) as count'
        ])
        .groupBy('agency.name, enrollment.enrollment_program')
        .orderBy('agency.name', 'ASC')
        .getRawMany()

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async countScholarshipsGroupingByStatusForAgency(agencyName: string) {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.agency', 'agency')
        .where('agency.name = :name', { name: agencyName })
        .select([
          'scholarship.status as status',
          'COUNT(scholarship.id) as count'
        ])
        .groupBy('scholarship.status')
        .getRawMany()

      return result
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
      const query = this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .innerJoin('scholarship.agency', 'agency')
        .where('scholarship.scholarship_starts_at <= :searchEnd', {
          searchEnd: dto.end_period
        })

        .select([
          `agency.name AS agency_name`,
          'scholarship.status AS status',
          `SUM(CASE WHEN enrollment.enrollment_program = 'MESTRADO' THEN 1 ELSE 0 END) AS masters_count`,
          `SUM(CASE WHEN enrollment.enrollment_program = 'DOUTORADO' THEN 1 ELSE 0 END) AS phd_count`
        ])
        .groupBy(`agency.name`)
        .addGroupBy('scholarship.status')

      query.andWhere(
        'COALESCE(scholarship.extension_ends_at, scholarship.scholarship_ends_at) >= :searchStart',
        {
          searchStart: dto.start_period
        }
      )

      const result = await query.getRawMany()

      return result
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_FAILED
      )
    }
  }

  async copyFilteredScholarshipsStudentsEmails(
    filters: ScholarshipFilters
  ): Promise<string[]> {
    try {
      const query = this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .innerJoin('enrollment.student', 'student')
        .leftJoin('scholarship.agency', 'agency')
        .leftJoin('scholarship.allocation', 'allocation')
        .leftJoin('enrollment.advisor', 'advisor')
        .select('DISTINCT student.email', 'email')

      if (filters?.scholarshipStatus && filters?.scholarshipStatus !== 'ALL') {
        if (filters?.scholarshipStatus === 'ON_GOING') {
          query.andWhere('scholarship.status IN (:...statuses)', {
            statuses: ['ON_GOING', 'EXTENDED']
          })
        } else {
          query.andWhere('scholarship.status LIKE :status', {
            status: `%${filters.scholarshipStatus}%`
          })
        }
      }

      if (filters?.agencyName && filters?.agencyName !== 'ALL') {
        query.andWhere('agency.name LIKE :agencyName', {
          agencyName: `%${filters.agencyName}%`
        })
      }

      if (filters?.allocationName && filters?.allocationName !== 'ALL') {
        query.andWhere('allocation.name LIKE :allocationName', {
          allocationName: `%${filters.allocationName}%`
        })
      }

      if (filters?.programName && filters?.programName !== 'ALL') {
        query.andWhere('enrollment.enrollment_program LIKE :programName', {
          programName: `%${filters.programName}%`
        })
      }

      if (filters?.advisorName && filters?.advisorName !== 'ALL') {
        query.andWhere('advisor.name LIKE :advisorName', {
          advisorName: `%${filters.advisorName}%`
        })
      }

      const rawResults = await query.getRawMany()

      return rawResults.map((row) => row.email)
    } catch (error) {
      console.error('Erro ao buscar e-mails:', error)
      throw new InternalServerErrorException('Falha ao gerar lista de e-mails.')
    }
  }
}
