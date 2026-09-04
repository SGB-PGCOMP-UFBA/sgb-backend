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
import { countAllocatedScholarshipsByProgram } from '../../scholarship/utils/scholarship-allocation.util'

@Injectable()
export class AllocationService {
  constructor(
    @InjectRepository(Allocation)
    private readonly allocationRepository: Repository<Allocation>
  ) {}

  async create(createAllocationDto: CreateAllocationDto): Promise<Allocation> {
    try {
      const newAllocation =
        this.allocationRepository.create(createAllocationDto)
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

  async findOneById(id: number): Promise<Allocation> {
    const allocation = await this.allocationRepository.findOneBy({ id })

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

    const allocation = await this.allocationRepository.findOneBy({ name })
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
    const allocation = await this.allocationRepository.findOne({
      where: { id },
      relations: { scholarships: { enrollment: true } }
    })
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

    const updatedAllocation = this.allocationRepository.merge(
      allocation,
      updateAllocationDto
    )
    return await this.allocationRepository.save(updatedAllocation)
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
    const removedAllocation = await this.allocationRepository.delete(id)
    if (removedAllocation.affected) return true

    throw new NotFoundException(
      constants.exceptionMessages.allocation.NOT_FOUND
    )
  }
}
