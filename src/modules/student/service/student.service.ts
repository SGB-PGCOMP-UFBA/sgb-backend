import {
  Logger,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { Student } from '../entities/student.entity'
import { CreateStudentDto } from '../dto/create-student.dto'
import { hashPassword } from '../../../core/utils/bcrypt'
import { PageDto } from '../../../core/pagination/page.dto'
import { PageMetaDto } from '../../../core/pagination/page-meta.dto'
import { constants } from '../../../core/utils/constants'
import { StudentMapper } from '../mapper/student.mapper'
import { UpdateStudentDto } from '../dto/update-student.dto'

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student) private studentRepository: Repository<Student>
  ) {}

  async createStudent(dto: CreateStudentDto): Promise<Student> {
    this.logger.log(constants.exceptionMessages.student.CREATION_STARTED)
    try {
      const passwordHash = await hashPassword(dto.password ?? dto.tax_id.replace(/[-.]/g,''))
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

  async resetPassword(email: string, password: string): Promise<void> {
    const findStudent = await this.studentRepository.findOne({
      where: { email }
    })

    if (!findStudent) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    this.updatePassword(email, password)
  }

  async updatePassword(email: string, password: string): Promise<void> {
    const passwordHash = await hashPassword(password)
    await this.studentRepository.update({ email }, { password: passwordHash })
  }

  async update(id: number, dto: UpdateStudentDto) {
    const student = await this.studentRepository.findOneBy({ id: id })
    if (!student) {
      throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
    }

    const updatedStudent = await this.studentRepository.save({
      id: student.id,
      name: dto.name || student.name,
      email: dto.email || student.email,
      tax_id: dto.tax_id || student.tax_id,
      phone_number: dto.phone_number || student.phone_number,
    })

    return updatedStudent
  }

  async delete(id: number) {
    const removed = await this.studentRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.student.NOT_FOUND)
  }

  async countStudentsWithAndWithoutScholarships() {
    try {
      const result = await this.studentRepository.createQueryBuilder('student')
        .leftJoin('student.enrollments', 'enrollment')
        .leftJoin('enrollment.scholarships', 'scholarship')
        .select([
            'COUNT(DISTINCT student.id) as totalStudents',
            'COUNT(DISTINCT CASE WHEN scholarship.id IS NOT NULL THEN student.id END) as studentsWithScholarship',
            'COUNT(DISTINCT CASE WHEN scholarship.id IS NULL THEN student.id END) as studentsWithoutScholarship'
        ])
        .getRawOne();

      return result
    } catch (error) {
      throw new InternalServerErrorException(constants.exceptionMessages.student.COUNT_BY_SCHOLARSHIP_FAILED);
    }
  }
}
