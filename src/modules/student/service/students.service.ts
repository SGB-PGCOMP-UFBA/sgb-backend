import { BadRequestException, Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { Student } from '../entities/students.entity'
import { CreateStudentDto } from '../dto/create-student.dto'
import { hashPassword } from '../../../utils/bcrypt'
import { PageDto } from '../../../pageable/page.dto'
import { PageMetaDto } from '../../../pageable/page-meta.dto'
import { constants } from '../../../utils/constants'
import { toStudentResponseDto } from '../mapper/student.mapper'
import { ResponseStudentDto } from '../dto/student.response.dto'

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
    return await this.studentRepository.find()
  }

  async findAllPaginated(options: IPaginationOptions): Promise<PageDto<ResponseStudentDto>> {
    const studentsPaginate = paginate<Student>(this.studentRepository, options)
    const items = (await studentsPaginate).items
    const meta = (await studentsPaginate).meta
    
    const itemsDto = items.map(
      (student) => toStudentResponseDto(student)
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
}