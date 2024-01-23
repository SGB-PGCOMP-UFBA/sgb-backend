import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { Student } from '../entities/student.entity'
import { CreateStudentDto } from '../dto/create-student.dto'
import { hashPassword } from '../../../core/utils/bcrypt'
import { PageDto } from '../../../core/pagination/page.dto'
import { PageMetaDto } from '../../../core/pagination/page-meta.dto'
import { constants } from '../../../core/utils/constants'
import { toResponseStudentDto } from '../mapper/student.mapper'
import { ResponseStudentDto } from '../dto/response-student.dto'

@Injectable()
export class StudentService {
  constructor(@InjectRepository(Student) private studentRepository: Repository<Student>) {}

  async createStudent(student: CreateStudentDto): Promise<Student> {
    try {
      const passwordHash = await hashPassword(student.password)
      const newStudent = this.studentRepository.create({
        ...student,
        password: passwordHash
      })

      await this.studentRepository.save(newStudent)
      
      return newStudent
    } catch (error) {
      throw new BadRequestException(constants.exceptionMessages.student.CREATION_FAILED)
    }
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find({
      relations: ['articles', 'enrollments', 'enrollments.advisor', 'enrollments.scholarships']
    })
  }

  async findAllPaginated(options: IPaginationOptions): Promise<PageDto<ResponseStudentDto>> {
    const studentsPaginate = paginate<Student>(this.studentRepository, options, { relations: ['articles'] })
    const items = (await studentsPaginate).items
    const meta = (await studentsPaginate).meta
    
    const itemsDto = items.map(
      (student) => toResponseStudentDto(student)
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
}
