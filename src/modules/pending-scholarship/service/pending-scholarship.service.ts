import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { CreatePendingScholarshipDto } from '../dto/create-pending-scholarship.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { PendingScholarship } from '../entities/pending-scholarship.entity'
import { Repository } from 'typeorm'
import { SearchPendingScholarshipDto } from '../dto/search-pending-scholarship.dto'
import { StudentService } from 'src/modules/student/service/student.service'
import { constants } from 'src/core/utils/constants'
import { generateRandomPassword } from 'src/utils/generate-password.utils'
import { AdvisorService } from 'src/modules/advisor/service/advisor.service'
import { EnrollmentService } from 'src/modules/enrollment/services/enrollment.service'
import { CreateEnrollmentDto } from 'src/modules/enrollment/dtos/create-enrollment.dto'
import { CreateScholarshipDto } from 'src/modules/scholarship/dto/create-scholarship.dto'
import { UpdateScholarshipCsvUtil } from 'src/modules/data-manager/utils/update-scholarship-csv.util'
import { ApprovePendingScholarshipDto } from '../dto/approve-pending-scholarship.dto'
import { ScholarshipService } from 'src/modules/scholarship/service/scholarship.service'
import { AgencyEnum } from 'src/core/enums/AgencyEnum'

@Injectable()
export class PendingScholarshipService {
  private readonly logger = new Logger(StudentService.name)

  constructor(
    @InjectRepository(PendingScholarship)
    private readonly pendingScholarshipRepository: Repository<PendingScholarship>,
    private readonly studentService: StudentService,
    private readonly advisorService: AdvisorService,
    private readonly enrollmentService: EnrollmentService,
    private readonly scholarshipSerice: ScholarshipService
  ) {}

  async create(dto: CreatePendingScholarshipDto): Promise<PendingScholarship> {
    const existentPendingScholarship = await this.searchOne({
      ...dto,
      scholarship_starts_at: dto.scholarship_starts_at.toISOString(),
      scholarship_ends_at: dto.scholarship_ends_at.toISOString()
    })

    if (existentPendingScholarship) return null

    const newPendingScholarship = this.pendingScholarshipRepository.create(dto)
    return await this.pendingScholarshipRepository.save(newPendingScholarship)
  }

  async findAll(): Promise<PendingScholarship[]> {
    return await this.pendingScholarshipRepository.find()
  }

  async findOne(id: number) {
    return await this.pendingScholarshipRepository.findOne({
      where: { id }
    })
  }

  async searchOne(dto: SearchPendingScholarshipDto) {
    return await this.pendingScholarshipRepository.findOne({
      where: {
        ...dto,
        scholarship_starts_at: new Date(dto.scholarship_starts_at),
        scholarship_ends_at: new Date(dto.scholarship_ends_at)
      }
    })
  }

  async approve(dto: ApprovePendingScholarshipDto) {
    const pendingScholarhsip = await this.findOne(dto.id)
    if (!pendingScholarhsip)
      throw new NotFoundException(
        constants.exceptionMessages.pendingScholarship.APROVE_NOT_FOUND +
          ` Id: ${dto.id}`
      )

    const temporaryPassword = generateRandomPassword()

    try {
      if (!Object.keys(AgencyEnum).includes(pendingScholarhsip.agency))
        throw new BadRequestException('Agency name is not valid.')
      const advisor = await this.advisorService.findOneById(dto.advisor_id)
      const existentEnrollment =
        await this.enrollmentService.verifyExistentByStudentEmailAndNumber(
          dto.email,
          dto.enrollment_number
        )
      if (existentEnrollment)
        throw new BadRequestException('Enrollment number already in use.')

      await this.studentService.create({
        email: dto.email,
        name: pendingScholarhsip.student_name,
        tax_id: pendingScholarhsip.tax_id,
        password: temporaryPassword,
        link_to_lattes: null,
        phone_number: null
      })

      const createEnrollmentDto: CreateEnrollmentDto = {
        student_email: dto.email,
        advisor_email: advisor.email,
        enrollment_number: dto.enrollment_number,
        enrollment_program: pendingScholarhsip.enrollment_program,
        defense_prediction_date: null,
        enrollment_date: pendingScholarhsip.scholarship_starts_at
      }
      const enrollment = await this.enrollmentService.create(
        createEnrollmentDto
      )

      const scholarshipStatus = UpdateScholarshipCsvUtil.defineStatus(
        pendingScholarhsip.scholarship_starts_at,
        pendingScholarhsip.scholarship_ends_at
      )
      const createScholarshipDto: CreateScholarshipDto = {
        student_email: dto.email,
        enrollment_number: enrollment.enrollment_number,
        agency_name: pendingScholarhsip.agency,
        allocation_name: 'REMOTO',
        scholarship_starts_at: pendingScholarhsip.scholarship_starts_at,
        scholarship_ends_at: pendingScholarhsip.scholarship_ends_at,
        status: scholarshipStatus
      }

      const scholarhsip = await this.scholarshipSerice.create(
        createScholarshipDto
      )

      await this.pendingScholarshipRepository.delete(pendingScholarhsip.id)

      return scholarhsip
    } catch (error) {
      if (error.response) {
        switch (error.response.statusCode) {
          case 400:
            throw new BadRequestException(error.response.message)
          case 404:
            throw new NotFoundException(error.response.message)
          default:
            throw new BadRequestException(
              'Could not approve this student scholarhsip'
            )
        }
      }
      this.logger.log('Aprove pending scholarship error', error)
      return error
    }
  }
}
