import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { CreateAgencyDto } from '@/agency/dtos/create-agency.dto'
import { Agency } from '@/agency/entities/agency.entity'
import { UpdateAgencyDto } from '@/agency/dtos/update-agency.dto'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { constants } from '@/common/utils/constants'
import { countAllocatedScholarshipsByProgram } from '@/scholarship/utils/scholarship-allocation.util'

@Injectable()
export class AgencyService {
  constructor(private readonly agencyRepository: AgencyRepository) {}

  async findAll(): Promise<Agency[]> {
    return await this.agencyRepository.findAllWithScholarships()
  }

  async findAllForFilter(): Promise<Agency[]> {
    return await this.agencyRepository.findAllForFilter()
  }

  async findOneById(id: number): Promise<Agency> {
    const agency = await this.agencyRepository.findById(id)

    if (!agency) {
      throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
    }

    return agency
  }

  async findOneByName(name: string): Promise<Agency> {
    if (!name) {
      throw new NotFoundException(
        constants.exceptionMessages.agency.NAME_IS_REQUIRED
      )
    }

    const agency = await this.agencyRepository.findByName(name)
    if (!agency) {
      throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
    }

    return agency
  }

  async create(dto: CreateAgencyDto): Promise<Agency> {
    try {
      return await this.agencyRepository.create(dto)
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.agency.CREATION_FAILED
      )
    }
  }

  async update(id: number, dto: UpdateAgencyDto) {
    const agency = await this.agencyRepository.findByIdWithScholarships(id)

    if (!agency) {
      throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
    }

    const mastersAwardedScholarships =
      dto.masters_degree_awarded_scholarships ??
      agency.masters_degree_awarded_scholarships
    const doctorateAwardedScholarships =
      dto.doctorate_degree_awarded_scholarships ??
      agency.doctorate_degree_awarded_scholarships

    this.assertAwardedSlotsAreNotBelowAllocated(
      agency,
      mastersAwardedScholarships,
      doctorateAwardedScholarships
    )

    return await this.agencyRepository.update(agency.id, {
      name: dto.name || agency.name,
      description: dto.description || agency.description,
      masters_degree_awarded_scholarships: mastersAwardedScholarships,
      doctorate_degree_awarded_scholarships: doctorateAwardedScholarships
    })
  }

  private assertAwardedSlotsAreNotBelowAllocated(
    agency: Agency,
    mastersAwardedScholarships: number,
    doctorateAwardedScholarships: number
  ): void {
    const mastersAllocated = countAllocatedScholarshipsByProgram(
      agency.scholarships,
      'MESTRADO'
    )
    const doctorateAllocated = countAllocatedScholarshipsByProgram(
      agency.scholarships,
      'DOUTORADO'
    )

    if (mastersAwardedScholarships < mastersAllocated) {
      throw new BadRequestException(
        `${constants.exceptionMessages.agency.AWARDED_BELOW_ALLOCATED} ` +
          `Mestrado: ${mastersAllocated} vaga(s) alocada(s).`
      )
    }

    if (doctorateAwardedScholarships < doctorateAllocated) {
      throw new BadRequestException(
        `${constants.exceptionMessages.agency.AWARDED_BELOW_ALLOCATED} ` +
          `Doutorado: ${doctorateAllocated} vaga(s) alocada(s).`
      )
    }
  }

  async delete(id: number): Promise<boolean> {
    const affected = await this.agencyRepository.deleteById(id)
    if (affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
  }
}
