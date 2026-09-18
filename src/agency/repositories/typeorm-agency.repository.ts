import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Agency } from '@/agency/entities/agency.entity'
import { CreateAgencyDto } from '@/agency/dtos/create-agency.dto'
import { AgencyRepository } from '@/agency/repositories/agency.repository'

const WITH_SCHOLARSHIPS = ['scholarships', 'scholarships.enrollment']

@Injectable()
export class TypeOrmAgencyRepository implements AgencyRepository {
  constructor(
    @InjectRepository(Agency)
    private readonly repository: Repository<Agency>
  ) {}

  async findAllWithScholarships(): Promise<Agency[]> {
    return await this.repository.find({
      relations: WITH_SCHOLARSHIPS,
      order: { name: 'ASC' }
    })
  }

  async findAllForFilter(): Promise<Agency[]> {
    return await this.repository.find({ order: { name: 'ASC' } })
  }

  async findById(id: number): Promise<Agency | null> {
    return await this.repository.findOneBy({ id })
  }

  async findByIdWithScholarships(id: number): Promise<Agency | null> {
    return await this.repository.findOne({
      where: { id },
      relations: WITH_SCHOLARSHIPS
    })
  }

  async findByName(name: string): Promise<Agency | null> {
    return await this.repository.findOneBy({ name })
  }

  async create(data: CreateAgencyDto): Promise<Agency> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async update(id: number, data: Partial<Agency>): Promise<Agency> {
    return await this.repository.save({ ...data, id })
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }
}
