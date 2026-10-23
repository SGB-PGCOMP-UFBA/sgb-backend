import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { UserRepository } from '@/user/repositories/user.repository'
import { findAdvisorByEmail, findStudentByEmail } from '@/user/user-lookup.util'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { CreateEnrollmentDto } from '@/enrollment/dtos/create-enrollment.dto'
import {
  EnrollmentProgramRow,
  EnrollmentRepository
} from '@/enrollment/repositories/enrollment.repository'
import { constants } from '@/common/utils/constants'
import { UpdateEnrollmentDto } from '@/enrollment/dtos/update-enrollment.dto'

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name)

  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly userRepository: UserRepository
  ) {}

  async findAllForFilter(): Promise<EnrollmentProgramRow[]> {
    return await this.enrollmentRepository.findDistinctPrograms()
  }

  async findOneByIdAndStudentId(
    id: number,
    student_id: number
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findByIdAndStudentId(
      id,
      student_id
    )

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
    const student = await findStudentByEmail(this.userRepository, student_email)

    const enrollment = await this.enrollmentRepository.findByStudentIdAndNumber(
      student.id,
      enrollment_number
    )

    if (!enrollment) {
      throw new NotFoundException(
        constants.exceptionMessages.enrollment.NOT_FOUND
      )
    }

    return enrollment
  }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const existentEnrollment = await this.enrollmentRepository.findByNumber(
      dto.enrollment_number
    )
    if (existentEnrollment) {
      throw new ConflictException(
        `Matrícula com código ${dto.enrollment_number} já existente no sistema`
      )
    }

    const advisor = await findAdvisorByEmail(
      this.userRepository,
      dto.advisor_email
    )
    const student = await findStudentByEmail(
      this.userRepository,
      dto.student_email
    )

    const newEnrollment = await this.enrollmentRepository.create({
      student_id: student.id,
      advisor_id: advisor.id,
      enrollment_date: dto.enrollment_date,
      enrollment_number: dto.enrollment_number,
      enrollment_program: dto.enrollment_program,
      defense_prediction_date: dto.defense_prediction_date
    })

    this.logger.log(constants.exceptionMessages.enrollment.CREATION_COMPLETED)

    return newEnrollment
  }

  async update(id: number, dto: UpdateEnrollmentDto) {
    const advisor = await findAdvisorByEmail(
      this.userRepository,
      dto.advisor_email
    )
    const student = await findStudentByEmail(
      this.userRepository,
      dto.student_email
    )

    const enrollment = await this.enrollmentRepository.findByIdAndStudentId(
      id,
      student.id
    )

    if (!enrollment) {
      throw new NotFoundException(
        constants.exceptionMessages.enrollment.NOT_FOUND
      )
    }

    return await this.enrollmentRepository.update(enrollment.id, {
      advisor_id: advisor.id,
      enrollment_date: dto.enrollment_date || enrollment.enrollment_date,
      enrollment_program:
        dto.enrollment_program || enrollment.enrollment_program,
      enrollment_number: dto.enrollment_number || enrollment.enrollment_number,
      defense_prediction_date:
        dto.defense_prediction_date || enrollment.defense_prediction_date
    })
  }

  async delete(id: number): Promise<boolean> {
    const affected = await this.enrollmentRepository.deleteById(id)
    if (affected === 1) {
      return true
    }

    throw new NotFoundException(
      constants.exceptionMessages.enrollment.NOT_FOUND
    )
  }
}
