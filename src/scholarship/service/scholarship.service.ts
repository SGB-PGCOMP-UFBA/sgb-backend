import { Injectable } from '@nestjs/common'
import {
  BadRequestException,
  NotFoundException
} from '@nestjs/common/exceptions'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { ResponseScholarshipDto } from '../dto/response-scholarship.dto'
import { NewFinalDateScholarshipDto } from '../dto/update-scholarship.dto'
import { Scholarship, toScholarshipDTO } from '../entities/scholarship.entity'

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(Scholarship)
    private scholarshipRepository: Repository<Scholarship>
  ) {}

  async create(createScholarshipDto: CreateScholarshipDto) {
    return await this.scholarshipRepository.save(createScholarshipDto)
  }

  async findAll(): Promise<ResponseScholarshipDto[]> {
    const scholarships: Scholarship[] = await this.scholarshipRepository.find({
      relations: {
        student: true,
        agency: true
      }
    })

    return scholarships.map((scholarship) => toScholarshipDTO(scholarship))
  }

  async deactivateScholarship(id: number): Promise<void> {
    await this.scholarshipRepository.update(id, { active: false })
  }

  async findOneById(id: number): Promise<ResponseScholarshipDto> {
    const scholarship = await this.scholarshipRepository.find({
      where: { id: id },
      relations: {
        student: true,
        agency: true
      }
    })
    if (!scholarship || scholarship.length === 0) {
      throw new NotFoundException('Scholarship not found')
    }

    return toScholarshipDTO(scholarship[0])
  }

  async updateFinalDateScholarship(
    newFinalDate: NewFinalDateScholarshipDto,
    id: number
  ) {
    const scholarship = await this.scholarshipRepository.findOneBy({ id })
    if (!scholarship) throw new NotFoundException('Scholarship not found')

    if (newFinalDate.newFinalDate < scholarship.scholarship_starts_at) {
      throw new BadRequestException(
        'Scholarship new end date must be after the start date'
      )
    }

    if (newFinalDate.newFinalDate <= scholarship.scholarship_ends_at) {
      throw new BadRequestException(
        'Scholarship new end date must be after the current end date'
      )
    }
    this.scholarshipRepository.update(
      { id },
      { scholarship_ends_at: newFinalDate.newFinalDate }
    )
  }

  async findOneByStudentId(id: number): Promise<ResponseScholarshipDto> {
    const scholarship = await this.scholarshipRepository.find({
      where: { student_id: id },
      relations: {
        student: true,
        agency: true
      }
    })
    if (!scholarship || scholarship.length === 0) {
      throw new NotFoundException('Scholarship not found')
    }

    return toScholarshipDTO(scholarship[0])
  }

  async deleteById(id: number) {
    const scholarship = await this.scholarshipRepository.findOneBy({ id })
    if (!scholarship) throw new NotFoundException('Scholarship not found')

    this.scholarshipRepository.delete({ id })
  }

  async findByAgencyAndModel(agency_id: number, model: string) {
    if (!model) {
      const scholarships = await this.scholarshipRepository.find({
        relations: { agency: true, student: true },
        where: { agency_id: agency_id }
      })
      return scholarships.map((scholarship) => toScholarshipDTO(scholarship))
    } else {
      const scholarships = await this.scholarshipRepository.find({
        relations: { agency: true },
        where: { agency_id: agency_id, model: model }
      })
      return scholarships.map((scholarship) => toScholarshipDTO(scholarship))
    }
  }

  async findByAgency(agency_id: number, active: boolean) {
    const scholarships = await this.scholarshipRepository.find({
      relations: { agency: true },
      where: { agency_id: agency_id, active: active }
    })
    return scholarships.map((scholarship) => toScholarshipDTO(scholarship))
  }

  // async findAllByAgencyId(id: number): Promise<ResponseScholarshipDto[]> {
  //   const scholarships: Scholarship[] = await this.scholarshipRepository.find({
  //     where: { agency_id: id },
  //     relations: {
  //       agency: true
  //     }
  //   })
  //   return scholarships.map((scholarship) => toScholarshipDTO(scholarship))
  // }
}
