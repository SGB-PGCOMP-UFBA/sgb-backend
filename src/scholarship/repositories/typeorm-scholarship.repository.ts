import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm'
import {
  IPaginationOptions,
  Pagination,
  paginate
} from 'nestjs-typeorm-paginate'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { ScholarshipFilters } from '@/scholarship/scholarship-filters.interface'
import { CountScholarshipsAsReportBetweenDatesDto } from '@/scholarship/dtos/count-scholarship-courses-between-dates.dto'
import {
  ScholarshipReportCriteria,
  ScholarshipReportRow,
  AgencyProgramCountRow,
  AgencyStatusCountRow,
  CsvMatchCriteria,
  DuplicateCreateCriteria,
  DuplicateUpdateCriteria,
  ScholarshipRepository,
  SlotCountParams,
  StatusCountRow,
  YearProgramCountRow
} from '@/scholarship/repositories/scholarship.repository'
import {
  occupiesSlotSql,
  occupiesSlotWhere,
  derivedStatusSql,
  effectiveEndSql,
  scholarshipStatusPredicateSql,
  todayAsCalendarDay,
  ScholarshipStatus,
  ScholarshipStatusEnum
} from '@/scholarship/utils/scholarship-status.util'

const WITH_RELATIONS = [
  'agency',
  'enrollment',
  'enrollment.student',
  'enrollment.advisor'
]

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

const isSet = (value?: string) => Boolean(value) && value !== 'ALL'

@Injectable()
export class TypeOrmScholarshipRepository implements ScholarshipRepository {
  constructor(
    @InjectRepository(Scholarship)
    private readonly repository: Repository<Scholarship>
  ) {}

  private withRelationsQuery(): SelectQueryBuilder<Scholarship> {
    return this.repository
      .createQueryBuilder('scholarship')
      .leftJoinAndSelect('scholarship.agency', 'agency')
      .leftJoinAndSelect('scholarship.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.advisor', 'advisor')
  }

  private applyNameFilters(
    query: SelectQueryBuilder<Scholarship>,
    filters: ScholarshipFilters
  ): void {
    if (isSet(filters?.agencyName)) {
      query.andWhere('agency.name LIKE :agencyName', {
        agencyName: `%${filters.agencyName}%`
      })
    }
    if (isSet(filters?.allocationName)) {
      query.andWhere('allocation.name LIKE :allocationName', {
        allocationName: `%${filters.allocationName}%`
      })
    }
    if (isSet(filters?.programName)) {
      query.andWhere('enrollment.enrollment_program LIKE :programName', {
        programName: `%${filters.programName}%`
      })
    }
    if (isSet(filters?.advisorName)) {
      query.andWhere('advisor.name LIKE :advisorName', {
        advisorName: `%${filters.advisorName}%`
      })
    }
  }

  async findAllWithRelations(): Promise<Scholarship[]> {
    return await this.repository.find({ relations: WITH_RELATIONS })
  }

  async findPaginated(
    filters: ScholarshipFilters,
    options: IPaginationOptions
  ): Promise<Pagination<Scholarship>> {
    const query = this.withRelationsQuery()
      .leftJoinAndSelect('scholarship.allocation', 'allocation')
      .setParameter('today', todayAsCalendarDay())

    if (isSet(filters?.scholarshipStatus)) {
      const statusPredicate = scholarshipStatusPredicateSql(
        filters.scholarshipStatus
      )
      if (statusPredicate) query.andWhere(statusPredicate)
    }

    this.applyNameFilters(query, filters)

    if (filters?.studentName && filters?.studentName !== '') {
      query.andWhere('student.name ILIKE :studentName', {
        studentName: `%${filters.studentName}%`
      })
    }

    if (filters?.orderBy && orderByMapping[filters.orderBy]) {
      const [table, field, order] = orderByMapping[filters.orderBy]
      query.orderBy(`${table}.${field}`, order as 'ASC' | 'DESC')
    }

    return await paginate<Scholarship>(query, options)
  }

  async findAllOccupyingSlot(): Promise<Scholarship[]> {
    return await this.withRelationsQuery()
      .where(occupiesSlotSql())
      .setParameter('today', todayAsCalendarDay())
      .getMany()
  }

  async findAllEndingOn(referenceDay: string): Promise<Scholarship[]> {
    return await this.withRelationsQuery()
      .where(`${effectiveEndSql()} = CAST(:today AS date)`)
      .setParameter('today', referenceDay)
      .getMany()
  }

  async findAllEndingBetween(
    startDay: string,
    endDay: string
  ): Promise<Scholarship[]> {
    return await this.withRelationsQuery()
      .where(
        `${effectiveEndSql()} BETWEEN CAST(:startDay AS date) AND CAST(:endDay AS date)`
      )
      .setParameters({ startDay, endDay })
      .orderBy(effectiveEndSql(), 'ASC')
      .getMany()
  }

  async findByIdAndEnrollmentId(
    id: number,
    enrollmentId: number
  ): Promise<Scholarship | null> {
    return await this.repository.findOneBy({ id, enrollment_id: enrollmentId })
  }

  async findDuplicateForCreate(
    criteria: DuplicateCreateCriteria
  ): Promise<Scholarship | null> {
    return await this.repository.findOneBy({ ...criteria })
  }

  async findDuplicateForUpdate(
    criteria: DuplicateUpdateCriteria
  ): Promise<Scholarship | null> {
    return await this.repository.findOneBy({
      enrollment_id: criteria.enrollment_id,
      agency: { id: criteria.agency_id },
      allocation: { id: criteria.allocation_id },
      salary: criteria.salary,
      scholarship_starts_at: criteria.scholarship_starts_at,
      scholarship_ends_at: criteria.scholarship_ends_at,
      extension_ends_at: criteria.extension_ends_at ?? IsNull()
    })
  }

  async findMatchForCsvUpdate(
    criteria: CsvMatchCriteria
  ): Promise<Partial<Scholarship> | null> {
    return await this.repository
      .createQueryBuilder('scholarship')
      .select([
        'scholarship.id',
        'scholarship.scholarship_starts_at',
        'scholarship.scholarship_ends_at',
        'scholarship.extension_ends_at',
        'student.id',
        'student.name',
        'student.tax_id',
        'student.email',
        'agency.name',
        'enrollment.enrollment_program'
      ])
      .leftJoin('scholarship.enrollment', 'enrollment')
      .leftJoin('enrollment.student', 'student')
      .leftJoin('scholarship.agency', 'agency')
      .where('enrollment.enrollment_program = :program', {
        program: criteria.program
      })
      .andWhere('agency.name = :agency', { agency: criteria.agencyName })
      .andWhere('student.name ILike :studentName', {
        studentName: `%${criteria.studentName}%`
      })
      .getOne()
  }

  async findAllForReport(
    criteria: ScholarshipReportCriteria
  ): Promise<ScholarshipReportRow[]> {
    const query = this.repository
      .createQueryBuilder('scholarship')
      .innerJoin('scholarship.enrollment', 'enrollment')
      .innerJoin('enrollment.student', 'student')
      .innerJoin('scholarship.agency', 'agency')
      .select([
        'student.name AS student_name',
        'enrollment.enrollment_number AS enrollment_number',
        'agency.name AS agency_name',
        'enrollment.enrollment_program AS enrollment_program',
        'scholarship.scholarship_starts_at AS scholarship_starts_at',
        'scholarship.scholarship_ends_at AS scholarship_ends_at',
        'scholarship.extension_ends_at AS extension_ends_at'
      ])
      .orderBy('student.name', 'ASC')

    if (criteria.endDay) {
      query.andWhere(
        'scholarship.scholarship_starts_at <= CAST(:endDay AS date)',
        { endDay: criteria.endDay }
      )
    }

    if (criteria.startDay) {
      query.andWhere(`${effectiveEndSql()} >= CAST(:startDay AS date)`, {
        startDay: criteria.startDay
      })
    }

    if (criteria.enrollmentNumber) {
      query.andWhere('enrollment.enrollment_number = :enrollmentNumber', {
        enrollmentNumber: criteria.enrollmentNumber
      })
    }

    return await query.getRawMany()
  }

  async findDistinctStudentEmails(
    filters: ScholarshipFilters
  ): Promise<string[]> {
    const query = this.repository
      .createQueryBuilder('scholarship')
      .innerJoin('scholarship.enrollment', 'enrollment')
      .innerJoin('enrollment.student', 'student')
      .leftJoin('scholarship.agency', 'agency')
      .leftJoin('scholarship.allocation', 'allocation')
      .leftJoin('enrollment.advisor', 'advisor')
      .select('DISTINCT student.email', 'email')

    if (isSet(filters?.scholarshipStatus)) {
      const statusPredicate = scholarshipStatusPredicateSql(
        filters.scholarshipStatus
      )
      if (statusPredicate) {
        query
          .andWhere(statusPredicate)
          .setParameter('today', todayAsCalendarDay())
      }
    }

    this.applyNameFilters(query, filters)

    const rows = await query.getRawMany()
    return rows.map((row) => row.email)
  }

  async countOccupyingSlotByEnrollment(enrollmentId: number): Promise<number> {
    return await this.repository.count({
      where: occupiesSlotWhere().map((clause) => ({
        enrollment_id: enrollmentId,
        ...clause
      }))
    })
  }

  async countAllocatedSlots(params: SlotCountParams): Promise<number> {
    const query = this.repository
      .createQueryBuilder('scholarship')
      .innerJoin('scholarship.enrollment', 'enrollment')
      .where(occupiesSlotSql())
      .setParameter('today', todayAsCalendarDay())
      .andWhere('enrollment.enrollment_program = :program', {
        program: params.program
      })

    if (params.agencyId) {
      query.andWhere('scholarship.agency_id = :agencyId', {
        agencyId: params.agencyId
      })
    }

    if (params.allocationId) {
      query.andWhere('scholarship.allocation_id = :allocationId', {
        allocationId: params.allocationId
      })
    }

    if (params.excludingScholarshipId) {
      query.andWhere('scholarship.id != :excludingScholarshipId', {
        excludingScholarshipId: params.excludingScholarshipId
      })
    }

    return await query.getCount()
  }

  async countByProgramAndYear(
    agencyName?: string
  ): Promise<YearProgramCountRow[]> {
    const yearExpression = `TO_CHAR(scholarship.scholarship_starts_at, 'YYYY')`
    const query = this.repository
      .createQueryBuilder('scholarship')
      .innerJoin('scholarship.enrollment', 'enrollment')

    if (agencyName) {
      query
        .innerJoin('scholarship.agency', 'agency')
        .where('agency.name= :agencyName', { agencyName })
    }

    return await query
      .select([
        `${yearExpression} AS year`,
        `SUM(CASE WHEN enrollment.enrollment_program = 'MESTRADO' THEN 1 ELSE 0 END) AS masters_count`,
        `SUM(CASE WHEN enrollment.enrollment_program = 'DOUTORADO' THEN 1 ELSE 0 END) AS phd_count`
      ])
      .groupBy(yearExpression)
      .orderBy(yearExpression, 'ASC')
      .getRawMany()
  }

  async countByAgencyForProgramAndStatus(
    program: string,
    status: ScholarshipStatus
  ): Promise<AgencyProgramCountRow[]> {
    return await this.repository
      .createQueryBuilder('scholarship')
      .innerJoin('scholarship.agency', 'agency')
      .innerJoin('scholarship.enrollment', 'enrollment')
      .where(scholarshipStatusPredicateSql(status))
      .setParameter('today', todayAsCalendarDay())
      .andWhere('enrollment.enrollment_program = :course', { course: program })
      .select([
        'agency.name as agency_name',
        'enrollment.enrollment_program as course_name',
        'COUNT(scholarship.id) as count'
      ])
      .groupBy('agency.name, enrollment.enrollment_program')
      .orderBy('agency.name', 'ASC')
      .getRawMany()
  }

  async countByStatusForAgency(agencyName: string): Promise<StatusCountRow[]> {
    return await this.repository
      .createQueryBuilder('scholarship')
      .innerJoin('scholarship.agency', 'agency')
      .where('agency.name = :name', { name: agencyName })
      .setParameter('today', todayAsCalendarDay())
      .select([
        `${derivedStatusSql()} as status`,
        'COUNT(scholarship.id) as count'
      ])
      .groupBy(derivedStatusSql())
      .getRawMany()
  }

  async countAsReportBetweenDates(
    dto: CountScholarshipsAsReportBetweenDatesDto
  ): Promise<AgencyStatusCountRow[]> {
    return await this.repository
      .createQueryBuilder('scholarship')
      .innerJoin('scholarship.enrollment', 'enrollment')
      .innerJoin('scholarship.agency', 'agency')
      .where('scholarship.scholarship_starts_at <= :searchEnd', {
        searchEnd: dto.end_period
      })
      .setParameter('today', todayAsCalendarDay())
      .select([
        `agency.name AS agency_name`,
        `${derivedStatusSql()} AS status`,
        `SUM(CASE WHEN enrollment.enrollment_program = 'MESTRADO' THEN 1 ELSE 0 END) AS masters_count`,
        `SUM(CASE WHEN enrollment.enrollment_program = 'DOUTORADO' THEN 1 ELSE 0 END) AS phd_count`
      ])
      .groupBy(`agency.name`)
      .addGroupBy(derivedStatusSql())
      .andWhere(
        'COALESCE(scholarship.extension_ends_at, scholarship.scholarship_ends_at) >= :searchStart',
        { searchStart: dto.start_period }
      )
      .getRawMany()
  }

  async create(data: Partial<Scholarship>): Promise<Scholarship> {
    return await this.repository.save(this.repository.create(data))
  }

  async update(id: number, data: Partial<Scholarship>): Promise<Scholarship> {
    return await this.repository.save({ ...data, id })
  }

  async updateFields(id: number, changes: Partial<Scholarship>): Promise<void> {
    await this.repository.update({ id }, changes)
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }

  async deleteAllAndResetSequence(): Promise<void> {
    await this.repository.createQueryBuilder().delete().execute()
    await this.repository.query(
      `ALTER SEQUENCE scholarship_id_seq RESTART WITH 1`
    )
  }
}
