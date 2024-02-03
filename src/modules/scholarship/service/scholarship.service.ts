import { Injectable } from '@nestjs/common'
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common/exceptions'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { Scholarship } from '../entities/scholarship.entity'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(Scholarship)
    private scholarshipRepository: Repository<Scholarship>
  ) {}

  async findAll(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.find()
  }

  async findAllForNotification(): Promise<Scholarship[]> {
    return await this.scholarshipRepository.find({
      relations: [
        'agency',
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ],
      where: { active: true }
    })
  }

  async create(
    createScholarshipDto: CreateScholarshipDto
  ): Promise<Scholarship> {
    try {
      const newScholarship = this.scholarshipRepository.create({
        ...createScholarshipDto
      })

      await this.scholarshipRepository.save(newScholarship)

      return newScholarship
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.scholarship.CREATION_FAILED
      )
    }
  }

  async delete(id: number): Promise<boolean> {
    const removed = await this.scholarshipRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(
      constants.exceptionMessages.scholarship.NOT_FOUND
    )
  }

  async deactivate(id: number): Promise<void> {
    try {
      await this.scholarshipRepository.update(id, { active: false })
    } catch (error) {
      throw new InternalServerErrorException(
        constants.exceptionMessages.scholarship.DEACTIVATE_FAILED
      )
    }
  }

  async countGroupingByAgencyAndYear() {
    try {
      const result = await this.scholarshipRepository.createQueryBuilder('scholarship')
        .select([
          'EXTRACT(YEAR FROM scholarship.scholarship_starts_at) AS scholarship_year',
          'agency.name AS agency_name',
          'COUNT(scholarship.id) AS count'
        ])
        .innerJoin('scholarship.agency', 'agency')
        .where('scholarship.active = :active', { active: true })
        .groupBy('scholarship_year, agency_name')
        .orderBy('scholarship_year', 'ASC')
        .addOrderBy('agency_name', 'ASC')
        .getRawMany();  

      return result
    } catch (error) {
      throw new InternalServerErrorException(constants.exceptionMessages.scholarship.COUNT_BY_AGENCY_FAILED);
    }
  }
}
