import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Repository } from 'typeorm'
import { User } from '@/user/entities/user.entity'
import {
  UniqueUserField,
  UserRepository
} from '@/user/repositories/user.repository'
import { UserType } from '@/user/user-type.constant'
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
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async findById(id: number): Promise<User | null> {
    return await this.repository.findOneBy({ id })
  }

  async findByEmail(email: string, type: UserType): Promise<User | null> {
    return await this.repository.findOneBy({ email, role: type })
  }

  async findAdvisorWithAdminPrivilegesByEmail(
    email: string
  ): Promise<User | null> {
    return await this.repository.findOneBy({
      email,
      role: 'ADVISOR',
      has_admin_privileges: true
    })
  }

  async findByField(
    type: UserType,
    field: UniqueUserField,
    value: string
  ): Promise<User | null> {
    return await this.repository.findOneBy({ role: type, [field]: value })
  }

  async search(filters: UserSearchFilters, type?: UserType): Promise<User[]> {
    const where: FindOptionsWhere<User> = {
      ...userSearchWhere<User>(filters),
      ...(type && { role: type })
    }

    return await this.repository.find({ where, order: { name: 'ASC' } })
  }

  async findAllByType(type: UserType): Promise<User[]> {
    return await this.repository.find({
      where: { role: type },
      order: { name: 'ASC' }
    })
  }

  async findAdvisorsWithEnrollments(): Promise<User[]> {
    return await this.repository.find({
      where: { role: 'ADVISOR' },
      relations: ['advised_enrollments'],
      order: { name: 'ASC' }
    })
  }

  async findStudentWithEnrollments(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id, role: 'STUDENT' },
      relations: WITH_ENROLLMENTS_AND_ALLOCATION
    })
  }

  async findStudentsByAdvisorId(advisorId: number): Promise<User[]> {
    return await this.repository.find({
      relations: WITH_ENROLLMENTS,
      where: { role: 'STUDENT', enrollments: { advisor: { id: advisorId } } }
    })
  }

  async create(data: Partial<User>): Promise<User> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    return await this.repository.save({ ...data, id })
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.repository.update({ id }, { password: passwordHash })
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }
}
