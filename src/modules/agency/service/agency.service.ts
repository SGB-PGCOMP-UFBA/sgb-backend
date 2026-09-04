import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { Agency } from '../entities/agency.entity'
import { UpdateAgencyDto } from '../dto/update-agency.dto'
import { constants } from '../../../core/utils/constants'
import { countAllocatedScholarshipsByProgram } from '../../scholarship/utils/scholarship-allocation.util'

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency) private agencyRepository: Repository<Agency>
  ) {}

  async findAll(): Promise<Agency[]> {
    return await this.agencyRepository.find({
      relations: ['scholarships', 'scholarships.enrollment'],
      order: { name: 'ASC' }
    })
  }

  async findAllForFilter(): Promise<Agency[]> {
    const agencys = await this.agencyRepository.find({
      order: { name: 'ASC' }
    })

    return agencys
  }

  async findOneById(id: number): Promise<Agency> {
    const agency = await this.agencyRepository.findOneBy({ id })

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

    const agency = await this.agencyRepository.findOneBy({ name })
    if (!agency) {
      throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
    }

    return agency
  }

  async create(dto: CreateAgencyDto): Promise<Agency> {
    try {
      const newAgency = this.agencyRepository.create({ ...dto })
      await this.agencyRepository.save(newAgency)

      return newAgency
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.agency.CREATION_FAILED
      )
    }
  }

  async update(id: number, dto: UpdateAgencyDto) {
    const agency = await this.agencyRepository.findOne({
      where: { id: id },
      relations: ['scholarships', 'scholarships.enrollment']
    })

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

    const updatedAgency = await this.agencyRepository.save({
      id: agency.id,
      name: dto.name || agency.name,
      description: dto.description || agency.description,
      masters_degree_awarded_scholarships: mastersAwardedScholarships,
      doctorate_degree_awarded_scholarships: doctorateAwardedScholarships
    })

    return updatedAgency
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
    const removed = await this.agencyRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
  }
}
