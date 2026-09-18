import {
  Logger,
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { EmbedNotificationService } from '@/embed-notification/embed-notification.service'
import { CreateStudentDto } from '@/student/dtos/create-student.dto'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { UpdateStudentDto } from '@/student/dtos/update-student.dto'

const WELCOME_NOTIFICATION = {
  owner_type: 'STUDENT',
  title: 'Bem-vindo ao SGB-PGCOMP',
  description:
    'Seja bem-vindo ao sistema de gestão de bolsas. Não se esqueça de finalizar o seu cadastro!'
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name)

  constructor(
    private embedNotificationService: EmbedNotificationService,
    private readonly studentRepository: StudentRepository
  ) {}

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.findAllWithEnrollments()
  }

  async findAllByAdvisorId(advisorId: number): Promise<Student[]> {
    return await this.studentRepository.findAllByAdvisorId(advisorId)
  }

  async findByEmail(
    email: string,
    chargeDependencies = false
  ): Promise<Student> {
    const student = chargeDependencies
      ? await this.studentRepository.findByEmailWithEnrollments(email)
      : await this.studentRepository.findByEmail(email)

    if (!student) {
      this.logger.error(`Busca por estudante com e-mail = '${email}' falhou.`)
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    return student
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    this.logger.log(constants.exceptionMessages.student.CREATION_STARTED)

    try {
      return await this.registerAndNotify(dto)
    } catch (error: any) {
      this.logger.error(
        constants.exceptionMessages.student.CREATION_FAILED,
        error,
        `Student Email: ${dto.email}`
      )
      const errorMessage = String(error.message).includes('duplicate key')
        ? 'Email or CPF already in use'
        : error.message
      throw new BadRequestException(
        errorMessage || constants.exceptionMessages.student.CREATION_FAILED
      )
    }
  }

  async createOrReturnExistent(dto: CreateStudentDto): Promise<Student> {
    this.logger.log(constants.exceptionMessages.student.CREATION_STARTED)

    const studentExists = await this.studentRepository.findByEmail(dto.email)

    if (studentExists) {
      this.logger.log(constants.exceptionMessages.student.ALREADY_REGISTERED)
      return studentExists
    }

    try {
      return await this.registerAndNotify(dto)
    } catch (error: any) {
      this.logger.error(
        constants.exceptionMessages.student.CREATION_FAILED,
        error,
        `Student Email: ${dto.email}`
      )
      throw new BadRequestException(
        error.message || constants.exceptionMessages.student.CREATION_FAILED
      )
    }
  }

  private async registerAndNotify(dto: CreateStudentDto): Promise<Student> {
    const passwordHash = await hashPassword(dto.password)
    const newStudent = await this.studentRepository.create({
      ...dto,
      password: passwordHash
    })

    await this.embedNotificationService.create({
      ...WELCOME_NOTIFICATION,
      owner_id: newStudent.id
    } as never)

    this.logger.log(constants.exceptionMessages.student.CREATION_COMPLETED)

    return newStudent
  }

  async resetPassword(email: string, password: string): Promise<void> {
    const findStudent = await this.studentRepository.findByEmail(email)

    if (!findStudent) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    const passwordHash = await hashPassword(password)
    await this.studentRepository.updatePasswordByEmail(email, passwordHash)
  }

  async updatePassword(
    email: string,
    current_password: string,
    new_password: string
  ): Promise<void> {
    const findStudent = await this.studentRepository.findByEmail(email)

    if (!findStudent) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    const isPasswordMatching = await comparePassword(
      current_password,
      findStudent.password
    )

    if (!isPasswordMatching) {
      throw new BadRequestException(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
    }

    const passwordHash = await hashPassword(new_password)
    await this.studentRepository.updatePasswordByEmail(email, passwordHash)
  }

  async update(dto: UpdateStudentDto) {
    const studentFromDatabase = await this.studentRepository.findByEmail(
      dto.current_email
    )
    if (!studentFromDatabase) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    await this.validateUpdatingStudent(dto, studentFromDatabase)

    try {
      return await this.studentRepository.update(studentFromDatabase.id, {
        name: dto.name || studentFromDatabase.name,
        email: dto.email || studentFromDatabase.email,
        link_to_lattes: dto.link_to_lattes,
        tax_id: dto.tax_id,
        phone_number: dto.phone_number
      })
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.student.UPDATE_FAILED
      )
    }
  }

  async delete(id: number) {
    const affected = await this.studentRepository.deleteById(id)
    if (affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
  }

  async validateUpdatingStudent(
    dto: UpdateStudentDto,
    studentFromDatabase: Student
  ) {
    if (dto.tax_id && dto.tax_id !== studentFromDatabase.tax_id) {
      if (await this.studentRepository.findByTaxId(dto.tax_id)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
        )
      }
    }

    if (dto.email && dto.email !== studentFromDatabase.email) {
      if (await this.studentRepository.findByEmail(dto.email)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
        )
      }
    }

    if (
      dto.phone_number &&
      dto.phone_number !== studentFromDatabase.phone_number
    ) {
      if (await this.studentRepository.findByPhoneNumber(dto.phone_number)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
        )
      }
    }

    if (
      dto.link_to_lattes &&
      dto.link_to_lattes !== studentFromDatabase.link_to_lattes
    ) {
      if (await this.studentRepository.findByLinkToLattes(dto.link_to_lattes)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.LINK_TO_LATTES_ALREADY_REGISTERED
        )
      }
    }
  }

  async deleteAll() {
    this.logger.warn(constants.exceptionMessages.student.DELETE_ALL_STARTED)
    await this.studentRepository.deleteAllAndResetSequence()
  }
}
