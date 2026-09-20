import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { CreateAllocationDto } from '@/allocation/dtos/create-allocation.dto'
import { AllocationRepository } from '@/allocation/repositories/allocation.repository'

const WITH_SCHOLARSHIPS = { scholarships: { enrollment: true } }

@Injectable()
export class TypeOrmAllocationRepository implements AllocationRepository {
  constructor(
    @InjectRepository(Allocation)
    private readonly repository: Repository<Allocation>
  ) {}

  async findAllWithScholarships(): Promise<Allocation[]> {
    return await this.repository.find({
      relations: WITH_SCHOLARSHIPS,
      order: { name: 'ASC' }
    })
  }

  async findAllForFilter(): Promise<Allocation[]> {
    return await this.repository.find({ order: { name: 'ASC' } })
  }

  async findById(id: number): Promise<Allocation | null> {
    return await this.repository.findOneBy({ id })
  }

  async findByIdWithScholarships(id: number): Promise<Allocation | null> {
    return await this.repository.findOne({
      where: { id },
      relations: WITH_SCHOLARSHIPS
    })
  }

  async findByName(name: string): Promise<Allocation | null> {
    return await this.repository.findOneBy({ name })
  }

  async create(data: CreateAllocationDto): Promise<Allocation> {
    return await this.repository.save(this.repository.create(data))
  }

  async update(
    allocation: Allocation,
    changes: Partial<Allocation>
  ): Promise<Allocation> {
    return await this.repository.save(
      this.repository.merge(allocation, changes)
    )
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }
}
