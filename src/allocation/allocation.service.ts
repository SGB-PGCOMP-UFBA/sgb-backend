import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { CreateAllocationDto } from '@/allocation/dtos/create-allocation.dto'
import { UpdateAllocationDto } from '@/allocation/dtos/update-allocation.dto'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { AllocationRepository } from '@/allocation/repositories/allocation.repository'
import { constants } from '@/common/utils/constants'

@Injectable()
export class AllocationService {
  constructor(private readonly allocationRepository: AllocationRepository) {}

  async create(createAllocationDto: CreateAllocationDto): Promise<Allocation> {
    try {
      return await this.allocationRepository.create(createAllocationDto)
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.allocation.CREATION_FAILED
      )
    }
  }

  async findAll(): Promise<Allocation[]> {
    return await this.allocationRepository.findAllWithScholarships()
  }

  findOne(id: number) {
    return `This action returns a #${id} allocation`
  }

  async findAllForFilter(): Promise<Allocation[]> {
    return await this.allocationRepository.findAllForFilter()
  }

  async findOneById(id: number): Promise<Allocation> {
    const allocation = await this.allocationRepository.findById(id)

    if (!allocation) {
      throw new NotFoundException(
        constants.exceptionMessages.allocation.NOT_FOUND
      )
    }

    return allocation
  }

  async findOneByName(name: string): Promise<Allocation> {
    if (!name) {
      throw new NotFoundException(
        constants.exceptionMessages.allocation.NAME_IS_REQUIRED
      )
    }

    const allocation = await this.allocationRepository.findByName(name)
    if (!allocation) {
      throw new NotFoundException(
        constants.exceptionMessages.allocation.NOT_FOUND
      )
    }

    return allocation
  }

  async update(
    id: number,
    updateAllocationDto: UpdateAllocationDto
  ): Promise<Allocation> {
    const allocation = await this.allocationRepository.findByIdWithScholarships(
      id
    )
    if (!allocation)
      throw new NotFoundException(
        constants.exceptionMessages.allocation.NOT_FOUND
      )

    return await this.allocationRepository.update(
      allocation,
      updateAllocationDto
    )
  }

  async delete(id: number): Promise<boolean> {
    const affected = await this.allocationRepository.deleteById(id)
    if (affected) return true

    throw new NotFoundException(
      constants.exceptionMessages.allocation.NOT_FOUND
    )
  }
}
