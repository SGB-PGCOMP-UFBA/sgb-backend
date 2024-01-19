import { Injectable } from '@nestjs/common'
import { BadRequestException, NotFoundException } from '@nestjs/common/exceptions'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { Scholarship } from '../entities/scholarship.entity'
import { constants } from '../../../utils/constants'

@Injectable()
export class ScholarshipService {
  constructor(@InjectRepository(Scholarship) private scholarshipRepository: Repository<Scholarship>) {}

  async create(createScholarshipDto: CreateScholarshipDto): Promise<Scholarship> {
    try{
      const newScholarship = this.scholarshipRepository.create({ ...createScholarshipDto })
      
      await this.scholarshipRepository.save(newScholarship)

      return newScholarship
    }
    catch(error) {
      throw new BadRequestException(constants.exceptionMessages.scholarship.CREATION_FAILED)
    }
  }

  async findAll(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.find({
      relations: {
        student: true,
        agency: true,
        advisor: true,
      }
    })
  }

  async remove(id: number): Promise<boolean> {
    const removed = await this.scholarshipRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.scholarship.NOT_FOUND)
  }
}
