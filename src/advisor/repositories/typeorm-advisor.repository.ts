import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { CreateAdvisorDto } from '@/advisor/dtos/create-advisor.dto'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'

@Injectable()
export class TypeOrmAdvisorRepository implements AdvisorRepository {
  constructor(
    @InjectRepository(Advisor)
    private readonly repository: Repository<Advisor>
  ) {}

  async findAllWithEnrollments(): Promise<Advisor[]> {
    return await this.repository.find({
      relations: ['enrollments'],
      order: { name: 'ASC' }
    })
  }

  async findAllForFilter(): Promise<Advisor[]> {
    return await this.repository.find({ order: { name: 'ASC' } })
  }

  async findById(id: number): Promise<Advisor | null> {
    return await this.repository.findOneBy({ id })
  }

  async findByEmail(email: string): Promise<Advisor | null> {
    return await this.repository.findOneBy({ email })
  }

  async findByTaxId(taxId: string): Promise<Advisor | null> {
    return await this.repository.findOneBy({ tax_id: taxId })
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Advisor | null> {
    return await this.repository.findOneBy({ phone_number: phoneNumber })
  }

  async findByEmailAndAdminPrivileges(
    email: string,
    hasAdminPrivileges: boolean
  ): Promise<Advisor | null> {
    return await this.repository.findOne({
      where: { email, has_admin_privileges: hasAdminPrivileges }
    })
  }

  async create(data: CreateAdvisorDto): Promise<Advisor> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async update(id: number, data: Partial<Advisor>): Promise<Advisor> {
    return await this.repository.save({ ...data, id })
  }

  async updatePasswordByEmail(
    email: string,
    passwordHash: string
  ): Promise<void> {
    await this.repository.update({ email }, { password: passwordHash })
  }

  async setAdminPrivileges(
    id: number,
    hasAdminPrivileges: boolean
  ): Promise<void> {
    await this.repository.update(
      { id },
      { has_admin_privileges: hasAdminPrivileges }
    )
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }
}
