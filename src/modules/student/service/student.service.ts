import {
  Logger,
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { Student } from '../entities/student.entity'
import { CreateStudentDto } from '../dto/create-student.dto'
import { hashPassword } from '../../../core/utils/bcrypt'
import { decidePassword } from '../../../core/utils/password'
import { PageDto } from '../../../core/pagination/page.dto'
import { PageMetaDto } from '../../../core/pagination/page-meta.dto'
import { constants } from '../../../core/utils/constants'
import { StudentMapper } from '../mapper/student.mapper'
import { UpdateStudentDto } from '../dto/update-student.dto'

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name)

  constructor(
    @InjectRepository(Student) private studentRepository: Repository<Student>
  ) {}

  async createStudent(dto: CreateStudentDto): Promise<Student> {
    this.logger.log(constants.exceptionMessages.student.CREATION_STARTED)
    try {
      const passwordHash = await hashPassword(decidePassword(dto))
      const newStudent = this.studentRepository.create({
        ...dto,
        password: passwordHash
      })

      await this.studentRepository.save(newStudent)
      this.logger.log(constants.exceptionMessages.student.CREATION_COMPLETED)

      return newStudent
    } catch (error) {
      this.logger.error(error.detail)
      throw new BadRequestException(
        constants.exceptionMessages.student.CREATION_FAILED
      )
    }
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find({
      relations: [
        'articles',
        'enrollments',
        'enrollments.advisor',
        'enrollments.scholarships'
      ]
    })
  }

  async findAllByAdvisorId(advisorId: number): Promise<Student[]> {
    return await this.studentRepository.find({
      relations: [
        'articles',
        'enrollments',
        'enrollments.advisor',
        'enrollments.scholarships'
      ],
      where: {
        enrollments: {
          advisor: { id: advisorId }
        }
      }
    })
  }

  async findAllPaginated(options: IPaginationOptions): Promise<PageDto<any>> {
    const studentsPaginate = paginate<Student>(
      this.studentRepository,
      options,
      { relations: ['articles'] }
    )
    const items = (await studentsPaginate).items
    const meta = (await studentsPaginate).meta

    const itemsDto = items.map((student) => StudentMapper.detailed(student))

    const metaDto = new PageMetaDto(
      meta.totalItems,
      meta.itemCount,
      meta.itemsPerPage,
      meta.totalPages,
      meta.currentPage
    )

    return new PageDto(itemsDto, metaDto)
  }

  async findOneByEmail(email: string): Promise<Student> {
    const student = await this.studentRepository.findOneBy({ email })
    if (!student) {
      this.logger.error(`'${email}' não foi encontrado na base de estudantes.`)
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    return student
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

  async updatePassword(email: string, password: string): Promise<void> {
    const findStudent = await this.studentRepository.findOne({
      where: { email }
    })

    if (!findStudent) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    const passwordHash = await hashPassword(password)
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
        link_to_lattes:
          dto.link_to_lattes || studentFromDatabase.link_to_lattes,
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
}
