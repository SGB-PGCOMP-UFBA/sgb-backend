import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { ResponseAgencyDto } from '../dto/response-agency.dto'
import { Agency } from '../entities/agency.entity'

@Injectable()
export class AgencyService {
  constructor(@InjectRepository(Agency) private agencyRepository: Repository<Agency>) {}

  async create(createAgencyDto: CreateAgencyDto): Promise<Agency> {
    try{
      const newAgency= this.agencyRepository.create({ ...createAgencyDto })
      await this.agencyRepository.save(createAgencyDto)

      return newAgency
    }
    catch (error) {
      throw new BadRequestException("Can't create agency.")
    }
  }

  async findAll(): Promise<Agency[]> {
    const agencys = await this.agencyRepository.find()
    return agencys
  }

  async remove(id: number) {
    const removed = await this.agencyRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException('Agency not found.')
  }
}