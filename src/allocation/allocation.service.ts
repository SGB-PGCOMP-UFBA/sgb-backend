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
import { countAllocatedScholarshipsByProgram } from '@/scholarship/utils/scholarship-allocation.util'

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

    this.assertAwardedSlotsAreNotBelowAllocated(
      allocation,
      updateAllocationDto.masters_degree_awarded_scholarships ??
        allocation.masters_degree_awarded_scholarships,
      updateAllocationDto.doctorate_degree_awarded_scholarships ??
        allocation.doctorate_degree_awarded_scholarships
    )

    return await this.allocationRepository.update(
      allocation,
      updateAllocationDto
    )
  }

  private assertAwardedSlotsAreNotBelowAllocated(
    allocation: Allocation,
    mastersAwardedScholarships: number,
    doctorateAwardedScholarships: number
  ): void {
    const mastersAllocated = countAllocatedScholarshipsByProgram(
      allocation.scholarships,
      'MESTRADO'
    )
    const doctorateAllocated = countAllocatedScholarshipsByProgram(
      allocation.scholarships,
      'DOUTORADO'
    )

    if (
      mastersAwardedScholarships > 0 &&
      mastersAwardedScholarships < mastersAllocated
    ) {
      throw new BadRequestException(
        `${constants.exceptionMessages.allocation.AWARDED_BELOW_ALLOCATED} ` +
          `Mestrado: ${mastersAllocated} vaga(s) alocada(s).`
      )
    }

    if (
      doctorateAwardedScholarships > 0 &&
      doctorateAwardedScholarships < doctorateAllocated
    ) {
      throw new BadRequestException(
        `${constants.exceptionMessages.allocation.AWARDED_BELOW_ALLOCATED} ` +
          `Doutorado: ${doctorateAllocated} vaga(s) alocada(s).`
      )
    }
  }

  async delete(id: number): Promise<boolean> {
    const affected = await this.allocationRepository.deleteById(id)
    if (affected) return true

    throw new NotFoundException(
      constants.exceptionMessages.allocation.NOT_FOUND
    )
  }
}
