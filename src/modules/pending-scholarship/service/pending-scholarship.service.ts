import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { CreatePendingScholarshipDto } from '../dto/create-pending-scholarship.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { PendingScholarship } from '../entities/pending-scholarship.entity'
import { Repository } from 'typeorm'
import { SearchPendingScholarshipDto } from '../dto/search-pending-scholarship.dto'
import { StudentService } from '@/modules/student/service/student.service'
import { constants } from '@/core/utils/constants'
import { generateRandomPassword } from '@/utils/generate-password.utils'
import { AdvisorService } from '@/modules/advisor/service/advisor.service'
import { EnrollmentService } from '@/modules/enrollment/services/enrollment.service'
import { CreateEnrollmentDto } from '@/modules/enrollment/dtos/create-enrollment.dto'
import { CreateScholarshipDto } from '@/modules/scholarship/dto/create-scholarship.dto'
import { UpdateScholarshipCsvUtil } from '@/modules/data-manager/utils/update-scholarship-csv.util'
import { ApprovePendingScholarshipDto } from '../dto/approve-pending-scholarship.dto'
import { ScholarshipService } from '@/modules/scholarship/service/scholarship.service'
import { AgencyEnum } from '@/core/enums/AgencyEnum'
import { Student } from '@/modules/student/entities/student.entity'
import { Enrollment } from '@/modules/enrollment/entities/enrollment.entity'
import { Response } from 'express'
import { EmailService } from '@/services/email-sending/service/email.service'

@Injectable()
export class PendingScholarshipService {
  private readonly logger = new Logger(PendingScholarshipService.name)

  constructor(
    @InjectRepository(PendingScholarship)
    private readonly pendingScholarshipRepository: Repository<PendingScholarship>,
    private readonly studentService: StudentService,
    private readonly advisorService: AdvisorService,
    private readonly enrollmentService: EnrollmentService,
    private readonly scholarshipService: ScholarshipService,
    private readonly emailService: EmailService
  ) {}

  async create(dto: CreatePendingScholarshipDto): Promise<PendingScholarship> {
    const existentPendingScholarship = await this.searchOne({
      ...dto,
      scholarship_starts_at: dto.scholarship_starts_at.toISOString(),
      scholarship_ends_at: dto.scholarship_ends_at.toISOString()
    })

    if (existentPendingScholarship) return null

    const newPendingScholarship = this.pendingScholarshipRepository.create(dto)
    const pendingScholarship = await this.pendingScholarshipRepository.save(
      newPendingScholarship
    )
    return pendingScholarship
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

  async delete(id: number) {
    const pendingScholarhsip =
      await this.pendingScholarshipRepository.findOneBy({ id })
    if (!pendingScholarhsip)
      throw new NotFoundException(
        `Can't delete data: ${constants.exceptionMessages.pendingScholarship.NOT_FOUND}`
      )
    try {
      await this.pendingScholarshipRepository.remove(pendingScholarhsip)
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.pendingScholarship.DELETE_FAILED,
        error.message
      )
    }
  }

  async approve(dto: ApprovePendingScholarshipDto, response: Response) {
    const pendingScholarhsip = await this.findOne(dto.id)
    if (!pendingScholarhsip)
      throw new NotFoundException(
        constants.exceptionMessages.pendingScholarship.APROVE_NOT_FOUND +
          ` Id: ${dto.id}`
      )

    const temporaryPassword = generateRandomPassword()
    let student: Student,
      enrollment: Enrollment,
      responseCode = 201,
      sendEmail = true

    try {
      if (!Object.keys(AgencyEnum).includes(pendingScholarhsip.agency))
        throw new BadRequestException('Agency name is not valid.')

      const advisor = await this.advisorService.findOneById(dto.advisor_id)

      const existentEnrollment =
        await this.enrollmentService.verifyExistentByNumber(
          dto.enrollment_number
        )

      if (!existentEnrollment) {
        student = await this.studentService.create({
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
        enrollment = await this.enrollmentService.create(createEnrollmentDto)
      } else if (existentEnrollment.scholarships.length) {
        throw new ConflictException(
          'This enrollment already has an active scholarship.'
        )
      } else {
        enrollment = existentEnrollment
        student = existentEnrollment.student
        await this.studentService.update({
          current_email: student.email,
          tax_id: pendingScholarhsip.tax_id
        })
        responseCode = 200
        sendEmail = false
      }

      const scholarshipStatus = UpdateScholarshipCsvUtil.defineStatus(
        pendingScholarhsip.scholarship_starts_at,
        pendingScholarhsip.scholarship_ends_at
      )
      const createScholarshipDto: CreateScholarshipDto = {
        student_email: student.email,
        enrollment_number: enrollment.enrollment_number,
        agency_name: pendingScholarhsip.agency,
        allocation_name: 'REMOTO',
        scholarship_starts_at: pendingScholarhsip.scholarship_starts_at,
        scholarship_ends_at: pendingScholarhsip.scholarship_ends_at,
        status: scholarshipStatus
      }

      await this.scholarshipService.create(createScholarshipDto)
      await this.pendingScholarshipRepository.delete(pendingScholarhsip.id)

      if (sendEmail)
        await this.emailService.sendEmailStudentAutomaticallyRegistered(
          student.email,
          temporaryPassword
        )

      return response
        .status(responseCode)
        .send({ name: student.name, email: student.email })
    } catch (error) {
      if (error.response) {
        this.logger.error(
          'Aprove pending scholarship error',
          error.response.message
        )

        switch (error.response.statusCode) {
          case 400:
            throw new BadRequestException(error.response.message)
          case 404:
            throw new NotFoundException(error.response.message)
          case 409:
            throw new ConflictException(error.response.message)
          default:
            throw new BadRequestException(
              'Could not approve this student scholarhsip'
            )
        }
      }
      this.logger.error('Aprove pending scholarship error', error)
      return error
    }
  }
}
