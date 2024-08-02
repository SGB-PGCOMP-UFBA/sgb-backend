import { Repository } from 'typeorm'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  BadRequestException,
  NotFoundException
} from '@nestjs/common/exceptions'
import { AdvisorService } from '../../../modules/advisor/service/advisor.service'
import { StudentService } from '../../../modules/student/service/student.service'
import { Enrollment } from '../entities/enrollment.entity'
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto'
import { constants } from '../../../core/utils/constants'
import { UpdateEnrollmentDto } from '../dtos/update-enrollment.dto'

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name)

  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    private advisorService: AdvisorService,
    private studentService: StudentService
  ) {}

  async findAllForFilter(): Promise<Enrollment[]> {
    const distinctEnrollmentPrograms = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.enrollment_program', 'enrollment_program')
      .distinct(true)
      .orderBy('enrollment.enrollment_program', 'ASC')
      .getRawMany()

    return distinctEnrollmentPrograms
  }

  async findOneByIdAndStudentId(
    id: number,
    student_id: number
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOneBy({
      id: id,
      student_id: student_id
    })

    if (!enrollment) {
      throw new NotFoundException(
        constants.exceptionMessages.enrollment.NOT_FOUND
      )
    }

    return enrollment
  }

  async findOneByStudentEmailAndEnrollmentNumber(
    student_email: string,
    enrollment_number: string
  ): Promise<Enrollment> {
    const student = await this.studentService.findByEmail(student_email)

    const enrollment = await this.enrollmentRepository.findOneBy({
      student_id: student.id,
      enrollment_number
    })

    if (!enrollment) {
      throw new NotFoundException(
        constants.exceptionMessages.enrollment.NOT_FOUND
      )
    }

    return enrollment
  }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    this.logger.log(constants.exceptionMessages.enrollment.CREATION_STARTED)

    try {
      const advisor = await this.advisorService.findOneByEmail(
        dto.advisor_email
      )

      const student = await this.studentService.findByEmail(dto.student_email)

      const newEnrollment = this.enrollmentRepository.create({
        student_id: student.id,
        advisor_id: advisor.id,
        enrollment_date: dto.enrollment_date,
        enrollment_number: dto.enrollment_number,
        enrollment_program: dto.enrollment_program,
        defense_prediction_date: dto.defense_prediction_date
      })

      await this.enrollmentRepository.save(newEnrollment)

      this.logger.log(constants.exceptionMessages.enrollment.CREATION_COMPLETED)

      return newEnrollment
    } catch (error) {
      this.logger.error(
        constants.exceptionMessages.enrollment.CREATION_FAILED,
        error,
        `Student Email: ${dto.student_email}`,
        `Advisor Email: ${dto.advisor_email}`,
        `Enrollment Number: ${dto.enrollment_number}`,
        `Enrollment Program: ${dto.enrollment_program}`
      )

      throw new BadRequestException(
        constants.exceptionMessages.enrollment.CREATION_FAILED
      )
    }
  }

  async update(id: number, dto: UpdateEnrollmentDto) {
    try {
      const advisor = await this.advisorService.findOneByEmail(
        dto.advisor_email
      )

      const student = await this.studentService.findByEmail(dto.student_email)

      const enrollment = await this.enrollmentRepository.findOneBy({
        id: id,
        student_id: student.id
      })

      if (!enrollment) {
        throw new NotFoundException(
          constants.exceptionMessages.enrollment.NOT_FOUND
        )
      }

      const updatedEnrollment = await this.enrollmentRepository.save({
        id: enrollment.id,
        advisor_id: advisor.id,
        enrollment_date: dto.enrollment_date || enrollment.enrollment_date,
        enrollment_program:
          dto.enrollment_program || enrollment.enrollment_program,
        enrollment_number:
          dto.enrollment_number || enrollment.enrollment_number,
        defense_prediction_date:
          dto.defense_prediction_date || enrollment.defense_prediction_date
      })

      return updatedEnrollment
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.enrollment.UPDATE_FAILED
      )
    }
  }

  async delete(id: number): Promise<boolean> {
    const removed = await this.enrollmentRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(
      constants.exceptionMessages.enrollment.NOT_FOUND
    )
  }
}
