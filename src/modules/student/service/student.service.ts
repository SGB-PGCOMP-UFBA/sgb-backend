import {
  Logger,
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { FindOneOptions, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Student } from '../entities/student.entity'
import { EmbedNotificationService } from '../../../modules/embed-notification/service/embed-notification.service'
import { CreateStudentDto } from '../dto/create-student.dto'
import { comparePassword, hashPassword } from '../../../core/utils/bcrypt'
import { constants } from '../../../core/utils/constants'
import { UpdateStudentDto } from '../dto/update-student.dto'

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name)

  constructor(
    private embedNotificationService: EmbedNotificationService,
    @InjectRepository(Student) private studentRepository: Repository<Student>
  ) {}

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find({
      relations: [
        'enrollments',
        'enrollments.advisor',
        'enrollments.scholarships',
        'enrollments.scholarships.agency'
      ]
    })
  }

  async findAllByAdvisorId(advisorId: number): Promise<Student[]> {
    return await this.studentRepository.find({
      relations: [
        'enrollments',
        'enrollments.advisor',
        'enrollments.scholarships',
        'enrollments.scholarships.agency'
      ],
      where: {
        enrollments: {
          advisor: { id: advisorId }
        }
      }
    })
  }

  async findByEmail(
    email: string,
    chargeDependencies = false
  ): Promise<Student> {
    const findOneOptions: FindOneOptions<Student> = {
      where: { email },
      relations: []
    }

    if (chargeDependencies) {
      findOneOptions.relations = [
        'enrollments',
        'enrollments.advisor',
        'enrollments.scholarships',
        'enrollments.scholarships.agency',
        'enrollments.scholarships.allocation',
      ]
    }

    const student = await this.studentRepository.findOne({
      ...findOneOptions
    })

    if (!student) {
      this.logger.error(`Busca por estudante com e-mail = '${email}' falhou.`)
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    return student
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    this.logger.log(constants.exceptionMessages.student.CREATION_STARTED)

    try {
      const passwordHash = await hashPassword(dto.password)
      const newStudent = this.studentRepository.create({
        ...dto,
        password: passwordHash
      })

      await this.studentRepository.save(newStudent)
      await this.embedNotificationService.create({
        owner_id: newStudent.id,
        owner_type: 'STUDENT',
        title: 'Bem-vindo ao SGB-PGCOMP',
        description:
          'Seja bem-vindo ao sistema de gestão de bolsas. Não se esqueça de finalizar o seu cadastro!'
      })

      this.logger.log(constants.exceptionMessages.student.CREATION_COMPLETED)

      return newStudent
    } catch (error) {
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

  async createOrReturnExistent(dto: CreateStudentDto): Promise<Student> {
    this.logger.log(constants.exceptionMessages.student.CREATION_STARTED)

    const studentExists = await this.studentRepository.findOneBy({
      email: dto.email
    })

    if (studentExists) {
      this.logger.log(constants.exceptionMessages.student.ALREADY_REGISTERED)
      return studentExists
    }

    try {
      const passwordHash = await hashPassword(dto.password)
      const newStudent = this.studentRepository.create({
        ...dto,
        password: passwordHash
      })

      await this.studentRepository.save(newStudent)
      await this.embedNotificationService.create({
        owner_id: newStudent.id,
        owner_type: 'STUDENT',
        title: 'Bem-vindo ao SGB-PGCOMP',
        description:
          'Seja bem-vindo ao sistema de gestão de bolsas. Não se esqueça de finalizar o seu cadastro!'
      })

      this.logger.log(constants.exceptionMessages.student.CREATION_COMPLETED)

      return newStudent
    } catch (error) {
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

  async resetPassword(email: string, password: string): Promise<void> {
    const findStudent = await this.studentRepository.findOne({
      where: { email }
    })

    if (!findStudent) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    const passwordHash = await hashPassword(password)
    await this.studentRepository.update({ email }, { password: passwordHash })
  }

  async updatePassword(
    email: string,
    current_password: string,
    new_password: string
  ): Promise<void> {
    const findStudent = await this.studentRepository.findOne({
      where: { email }
    })

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
    await this.studentRepository.update({ email }, { password: passwordHash })
  }

  async update(dto: UpdateStudentDto) {
    const studentFromDatabase = await this.studentRepository.findOneBy({
      email: dto.current_email
    })
    if (!studentFromDatabase) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    await this.validateUpdatingStudent(dto, studentFromDatabase)

    try {
      const updatedStudent = await this.studentRepository.save({
        id: studentFromDatabase.id,
        name: dto.name || studentFromDatabase.name,
        email: dto.email || studentFromDatabase.email,
        link_to_lattes: dto.link_to_lattes,
        tax_id: dto.tax_id,
        phone_number: dto.phone_number
      })

      return updatedStudent
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.student.UPDATE_FAILED
      )
    }
  }

  async delete(id: number) {
    const removed = await this.studentRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
  }

  async validateUpdatingStudent(
    dto: UpdateStudentDto,
    studentFromDatabase: Student
  ) {
    if (dto.tax_id && dto.tax_id !== studentFromDatabase.tax_id) {
      const studentFromTaxId = await this.studentRepository.findOneBy({
        tax_id: dto.tax_id
      })
      if (studentFromTaxId) {
        throw new BadRequestException(
          constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
        )
      }
    }

    if (dto.email && dto.email !== studentFromDatabase.email) {
      const studentFromEmail = await this.studentRepository.findOneBy({
        email: dto.email
      })
      if (studentFromEmail) {
        throw new BadRequestException(
          constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
        )
      }
    }

    if (
      dto.phone_number &&
      dto.phone_number !== studentFromDatabase.phone_number
    ) {
      const studentFromPhoneNumber = await this.studentRepository.findOneBy({
        phone_number: dto.phone_number
      })
      if (studentFromPhoneNumber) {
        throw new BadRequestException(
          constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
        )
      }
    }

    if (
      dto.link_to_lattes &&
      dto.link_to_lattes !== studentFromDatabase.link_to_lattes
    ) {
      const studentFromPhoneNumber = await this.studentRepository.findOneBy({
        link_to_lattes: dto.link_to_lattes
      })
      if (studentFromPhoneNumber) {
        throw new BadRequestException(
          constants.negotialValidationMessages.LINK_TO_LATTES_ALREADY_REGISTERED
        )
      }
    }
  }

  async deleteAll() {
    this.logger.warn(constants.exceptionMessages.student.DELETE_ALL_STARTED)
    await this.studentRepository.createQueryBuilder().delete().execute()
    await this.studentRepository.query(
      `ALTER SEQUENCE student_id_seq RESTART WITH 1`
    )
  }
}
