import { Injectable } from '@nestjs/common'
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common/exceptions'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Like, Repository } from 'typeorm'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { PageDto } from '../../../core/pagination/page.dto'
import { PageMetaDto } from '../../../core/pagination/page-meta.dto'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { Scholarship } from '../entities/scholarship.entity'
import { constants } from '../../../core/utils/constants'
import { ScholarshipMapper } from '../mapper/scholarship.mapper'
import { ScholarshipFilters } from '../filters/IScholarshipFilters'
import { AgencyService } from '../../../modules/agency/service/agency.service'
import { EnrollmentService } from '../../../modules/enrollment/services/enrollment.service'

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(Scholarship)
    private scholarshipRepository: Repository<Scholarship>,
    private agencyService: AgencyService,
    private enrollmentService: EnrollmentService
  ) {}

  async findAll(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.find()
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
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ],
      where: {}
    }

    if (filters?.scholarshipStatus && filters?.scholarshipStatus !== 'ALL') {
      findOptions.where['status'] = Like(`%${filters.scholarshipStatus}%`)
    }
    if (filters?.agencyName && filters?.agencyName !== 'ALL') {
      findOptions.where['agency'] = {
        name: Like(`%${filters.agencyName}%`)
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
      where: { status: 'ON_GOING' }
    })
  }

  async create(dto: CreateScholarshipDto): Promise<Scholarship> {
    try {
      const agency = await this.agencyService.findOneByName(dto.agency_name)
      const enrollment =
        await this.enrollmentService.findOneByStudentEmailAndEnrollmentProgram(
          dto.student_email,
          dto.enrollment_program
        )

      const newScholarship = this.scholarshipRepository.create({
        agency_id: agency.id,
        enrollment_id: enrollment.id,
        scholarship_starts_at: dto.scholarship_starts_at,
        scholarship_ends_at: dto.scholarship_ends_at,
        extension_ends_at: dto.extension_ends_at,
        salary: dto.salary
      })

      await this.scholarshipRepository.save(newScholarship)

      return newScholarship
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.scholarship.CREATION_FAILED
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

  async deactivate(id: number): Promise<void> {
    try {
      await this.scholarshipRepository.update(id, { status: 'FINALIZED' })
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.DEACTIVATE_FAILED
      )
    }
  }

  async countGroupingByAgencyAndYear() {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .select([
          'EXTRACT(YEAR FROM scholarship.scholarship_starts_at) AS scholarship_year',
          'agency.name AS agency_name',
          'COUNT(scholarship.id) AS count'
        ])
        .innerJoin('scholarship.agency', 'agency')
        .where('scholarship.status = :status', { status: 'ON_GOING' })
        .groupBy('scholarship_year, agency_name')
        .orderBy('scholarship_year', 'ASC')
        .addOrderBy('agency_name', 'ASC')
        .getRawMany()

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_BY_AGENCY_FAILED
      )
    }
  }

  async countGroupingByAgencyAndCourse() {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.agency', 'agency')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .where('scholarship.status = :status', { status: 'ON_GOING' })
        .select([
          'agency.name as agency_name',
          'enrollment.enrollment_program as course_name',
          'COUNT(scholarship.id) as count'
        ])
        .groupBy('agency.name, enrollment.enrollment_program')
        .getRawMany()

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_BY_AGENCY_FAILED
      )
    }
  }

  async countOnGoingScholarshipsGroupingByAgencyForCourse(programName: string) {
    try {
      const result = await this.scholarshipRepository
        .createQueryBuilder('scholarship')
        .innerJoin('scholarship.agency', 'agency')
        .innerJoin('scholarship.enrollment', 'enrollment')
        .where('scholarship.status = :status', { status: 'ON_GOING' })
        .andWhere('enrollment.enrollment_program = :course', {
          course: programName
        })
        .select([
          'agency.name as agency_name',
          'enrollment.enrollment_program as course_name',
          'COUNT(scholarship.id) as count'
        ])
        .groupBy('agency.name, enrollment.enrollment_program')
        .getRawMany()

      return result
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.COUNT_BY_AGENCY_FAILED
      )
    }
  }
}
