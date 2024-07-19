import { Injectable } from '@nestjs/common'
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common/exceptions'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository } from 'typeorm'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { PageDto } from '../../../core/pagination/page.dto'
import { PageMetaDto } from '../../../core/pagination/page-meta.dto'
import { Scholarship } from '../entities/scholarship.entity'
import { constants } from '../../../core/utils/constants'
import { StatusEnum } from '../../../core/enums/StatusEnum'
import { ScholarshipMapper } from '../mapper/scholarship.mapper'
import { ScholarshipFilters } from '../filters/IScholarshipFilters'
import { StudentService } from '../../../modules/student/service/student.service'
import { AgencyService } from '../../../modules/agency/service/agency.service'
import { EnrollmentService } from '../../../modules/enrollment/services/enrollment.service'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { UpdateScholarshipDto } from '../dto/update-scholarship.dto'

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
  constructor(
    @InjectRepository(Scholarship)
    private scholarshipRepository: Repository<Scholarship>,
    private agencyService: AgencyService,
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
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ],
      where: {},
      order: {}
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
        status: dto.status || StatusEnum.ON_GOING,
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

  async update(id: number, dto: UpdateScholarshipDto) {
    try {
      const student = await this.studentService.findByEmail(dto.student_email)

      const enrollment = await this.enrollmentService.findOneByIdAndStudentId(
        dto.enrollment_id,
        student.id
      )

      const scholarship = await this.scholarshipRepository.findOneBy({
        id: id,
        enrollment_id: enrollment.id
      })

      if (!scholarship) {
        throw new NotFoundException(
          constants.exceptionMessages.scholarship.NOT_FOUND
        )
      }

      const updatedScholarship = await this.scholarshipRepository.save({
        id: scholarship.id,
        salary: dto.salary,
        extension_ends_at: dto.extension_ends_at,
        status: dto.status || scholarship.status,
        agency_id: dto.agency_id || scholarship.agency_id,
        scholarship_starts_at:
          dto.scholarship_starts_at || scholarship.scholarship_starts_at,
        scholarship_ends_at:
          dto.scholarship_ends_at || scholarship.scholarship_ends_at
      })

      return updatedScholarship
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.scholarship.UPDATE_FAILED,
        error
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
      await this.scholarshipRepository.update(id, { status: 'FINISHED' })
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.DEACTIVATE_FAILED
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
}
