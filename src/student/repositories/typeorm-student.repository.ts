import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Student } from '@/student/entities/student.entity'
import { CreateStudentDto } from '@/student/dtos/create-student.dto'
import { StudentRepository } from '@/student/repositories/student.repository'
import { UserSearchFilters } from '@/common/interfaces/user-search-filters.interface'
import { userSearchWhere } from '@/common/utils/user-search.util'

const WITH_ENROLLMENTS = [
  'enrollments',
  'enrollments.advisor',
  'enrollments.scholarships',
  'enrollments.scholarships.agency'
]

const WITH_ENROLLMENTS_AND_ALLOCATION = [
  ...WITH_ENROLLMENTS,
  'enrollments.scholarships.allocation'
]

@Injectable()
export class TypeOrmStudentRepository implements StudentRepository {
  constructor(
    @InjectRepository(Student)
    private readonly repository: Repository<Student>
  ) {}

  async search(filters: UserSearchFilters): Promise<Student[]> {
    return await this.repository.find({
      where: userSearchWhere(filters),
      order: { name: 'ASC' }
    })
  }

  async findAllWithEnrollments(): Promise<Student[]> {
    return await this.repository.find({ relations: WITH_ENROLLMENTS })
  }

  async findAllByAdvisorId(advisorId: number): Promise<Student[]> {
    return await this.repository.find({
      relations: WITH_ENROLLMENTS,
      where: { enrollments: { advisor: { id: advisorId } } }
    })
  }

  async findByEmail(email: string): Promise<Student | null> {
    return await this.repository.findOne({ where: { email }, relations: [] })
  }

  async findByEmailWithEnrollments(email: string): Promise<Student | null> {
    return await this.repository.findOne({
      where: { email },
      relations: WITH_ENROLLMENTS_AND_ALLOCATION
    })
  }

  async findByTaxId(taxId: string): Promise<Student | null> {
    return await this.repository.findOneBy({ tax_id: taxId })
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Student | null> {
    return await this.repository.findOneBy({ phone_number: phoneNumber })
  }

  async findByLinkToLattes(linkToLattes: string): Promise<Student | null> {
    return await this.repository.findOneBy({ link_to_lattes: linkToLattes })
  }

  async create(data: CreateStudentDto): Promise<Student> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async update(id: number, data: Partial<Student>): Promise<Student> {
    return await this.repository.save({ ...data, id })
  }

  async updatePasswordByEmail(
    email: string,
    passwordHash: string
  ): Promise<void> {
    await this.repository.update({ email }, { password: passwordHash })
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }

  async deleteAllAndResetSequence(): Promise<void> {
    await this.repository.createQueryBuilder().delete().execute()
    await this.repository.query(`ALTER SEQUENCE student_id_seq RESTART WITH 1`)
  }
}
