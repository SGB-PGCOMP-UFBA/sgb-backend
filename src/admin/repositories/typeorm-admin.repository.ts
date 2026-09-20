import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Admin } from '@/admin/entities/admin.entity'
import { CreateAdminDto } from '@/admin/dtos/create-admin.dto'
import { AdminRepository } from '@/admin/repositories/admin.repository'

@Injectable()
export class TypeOrmAdminRepository implements AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private readonly repository: Repository<Admin>
  ) {}

  async findAllOrderedByName(): Promise<Admin[]> {
    return await this.repository.find({ order: { name: 'ASC' } })
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return await this.repository.findOneBy({ email })
  }

  async findByTaxId(taxId: string): Promise<Admin | null> {
    return await this.repository.findOneBy({ tax_id: taxId })
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Admin | null> {
    return await this.repository.findOneBy({ phone_number: phoneNumber })
  }

  async create(data: CreateAdminDto): Promise<Admin> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async update(id: number, data: Partial<Admin>): Promise<Admin> {
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
}
