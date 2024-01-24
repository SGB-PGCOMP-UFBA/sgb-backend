import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { Agency } from '../entities/agency.entity'

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency) private agencyRepository: Repository<Agency>
  ) {}

  async findAll(): Promise<Agency[]> {
    return await this.agencyRepository.find()
  }

  async create(dto: CreateAgencyDto): Promise<Agency> {
    try {
      const newAgency = this.agencyRepository.create({ ...dto })
      await this.agencyRepository.save(newAgency)

      return newAgency
    } catch (error) {
      throw new BadRequestException("Can't create agency.")
    }
  }

  async delete(id: number): Promise<boolean> {
    const removed = await this.agencyRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException('Agency not found.')
  }
}
