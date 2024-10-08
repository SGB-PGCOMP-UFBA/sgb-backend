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

  async findOneByName(name: string): Promise<Agency> {
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
    const agency = await this.agencyRepository.findOneBy({ id: id })
    if (!agency) {
      throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
    }

    const updatedAgency = await this.agencyRepository.save({
      id: agency.id,
      name: dto.name || agency.name,
      description: dto.description || agency.description,
      masters_degree_awarded_scholarships:
        dto.masters_degree_awarded_scholarships,
      doctorate_degree_awarded_scholarships:
        dto.doctorate_degree_awarded_scholarships
    })

    return updatedAgency
  }

  async delete(id: number): Promise<boolean> {
    const removed = await this.agencyRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.agency.NOT_FOUND)
  }
}
