import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateAllocationDto } from '../dto/create-allocation.dto'
import { UpdateAllocationDto } from '../dto/update-allocation.dto'
import { Allocation } from '../entities/allocation.entity'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class AllocationService {
  constructor(
    @InjectRepository(Allocation)
    private readonly allocationRepository: Repository<Allocation>
  ) {}

  async create(createAllocationDto: CreateAllocationDto): Promise<Allocation> {
    try {
      const newAllocation = this.allocationRepository.create(createAllocationDto)
      await this.allocationRepository.save(newAllocation)
      return newAllocation
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.allocation.CREATION_FAILED
      )
    }
  }

  async findAll(): Promise<Allocation[]> {
    return await this.allocationRepository.find({
      relations: { scholarships: { enrollment: true } },
      order: { name: 'ASC' }
    })
  }

  findOne(id: number) {
    return `This action returns a #${id} allocation`
  }

  async findAllForFilter(): Promise<Allocation[]> {
    return await this.allocationRepository.find({
      order: { name: 'ASC' }
    })
  }

  async update(id: number, updateAllocationDto: UpdateAllocationDto): Promise<Allocation> {
    const allocation = await this.allocationRepository.findOneBy({ id })
    if (!allocation)
      throw new NotFoundException(
        constants.exceptionMessages.allocation.NOT_FOUND
      )

    const updatedAllocation = this.allocationRepository.merge(
      allocation,
      updateAllocationDto
    )
    return await this.allocationRepository.save(updatedAllocation)
  }

  async delete(id: number): Promise<boolean> {
    const removedAllocation = await this.allocationRepository.delete(id)
    if (removedAllocation.affected) return true
    
    throw new NotFoundException(constants.exceptionMessages.allocation.NOT_FOUND)
  }
}
