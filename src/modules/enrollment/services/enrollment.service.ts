import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common/exceptions'
import { AdvisorService } from '../../../modules/advisor/service/advisor.service'
import { StudentService } from '../../../modules/student/service/student.service'
import { Enrollment } from '../entities/enrollment.entity'
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    private advisorService: AdvisorService,
    private studentService: StudentService
  ) {}

  async findAll(): Promise<Enrollment[]> {
    return await this.enrollmentRepository.find()
  }

  async findOneByStudentEmailAndEnrollmentProgram(
    student_email: string,
    enrollment_program: string
  ): Promise<Enrollment> {
    const student = await this.studentService.findOneByEmail(student_email)

    const enrollment = await this.enrollmentRepository.findOneBy({
      student_id: student.id,
      enrollment_program
    })

    if (!enrollment) {
      throw new NotFoundException(
        constants.exceptionMessages.enrollment.NOT_FOUND
      )
    }

    return enrollment
  }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    try {
      const advisor = await this.advisorService.findOneByEmail(
        dto.advisor_email
      )
      const student = await this.studentService.findOneByEmail(
        dto.student_email
      )

      const newEnrollment = this.enrollmentRepository.create({
        student_id: student.id,
        advisor_id: advisor.id,
        enrollment_date: dto.enrollment_date,
        enrollment_number: dto.enrollment_number,
        enrollment_program: dto.enrollment_program,
        defense_prediction_date: dto.defense_prediction_date
      })

      await this.enrollmentRepository.save(newEnrollment)

      return newEnrollment
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.enrollment.CREATION_FAILED
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

  async deactivate(id: number): Promise<void> {
    try {
      await this.enrollmentRepository.update(id, { active: false })
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.enrollment.DEACTIVATE_FAILED
      )
    }
  }
}
