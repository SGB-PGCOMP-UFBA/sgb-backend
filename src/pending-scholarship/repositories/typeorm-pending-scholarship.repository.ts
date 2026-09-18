import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PendingScholarship } from '@/pending-scholarship/entities/pending-scholarship.entity'
import { CreatePendingScholarshipDto } from '@/pending-scholarship/dtos/create-pending-scholarship.dto'
import { SearchPendingScholarshipDto } from '@/pending-scholarship/dtos/search-pending-scholarship.dto'
import { PendingScholarshipRepository } from '@/pending-scholarship/repositories/pending-scholarship.repository'

@Injectable()
export class TypeOrmPendingScholarshipRepository
  implements PendingScholarshipRepository
{
  constructor(
    @InjectRepository(PendingScholarship)
    private readonly repository: Repository<PendingScholarship>
  ) {}

  async findAll(): Promise<PendingScholarship[]> {
    return await this.repository.find()
  }

  async findById(id: number): Promise<PendingScholarship | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findBySearchCriteria(
    criteria: SearchPendingScholarshipDto
  ): Promise<PendingScholarship | null> {
    return await this.repository.findOne({
      where: {
        ...criteria,
        scholarship_starts_at: new Date(criteria.scholarship_starts_at),
        scholarship_ends_at: new Date(criteria.scholarship_ends_at)
      }
    })
  }

  async create(data: CreatePendingScholarshipDto): Promise<PendingScholarship> {
    return await this.repository.save(this.repository.create(data))
  }

  async remove(pendingScholarship: PendingScholarship): Promise<void> {
    await this.repository.remove(pendingScholarship)
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }
}
