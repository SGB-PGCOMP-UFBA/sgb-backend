import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common/exceptions'
import { Repository } from 'typeorm'
import { Enrollment } from '../entities/enrollment.entity'
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class EnrollmentService {
  constructor(@InjectRepository(Enrollment) private enrollmentRepository: Repository<Enrollment>) {}

  async findAll(): Promise<Enrollment[]> {
    return await this.enrollmentRepository.find()
  }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    try{
      const newEnrollment = this.enrollmentRepository.create({ ...dto })
      
      await this.enrollmentRepository.save(newEnrollment)

      return newEnrollment
    }
    catch(error) {
      throw new BadRequestException(constants.exceptionMessages.enrollment.CREATION_FAILED)
    }
  }

  async delete(id: number): Promise<boolean> {
    const removed = await this.enrollmentRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.enrollment.NOT_FOUND)
  }

  async deactivate(id: number): Promise<void> {
    try{
      await this.enrollmentRepository.update(id, { active: false })
    }
    catch(error) {
      throw new InternalServerErrorException(constants.exceptionMessages.enrollment.DEACTIVATE_FAILED)
    }
  }
}
