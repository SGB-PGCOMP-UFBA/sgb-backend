import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import {
  EnrollmentProgramRow,
  EnrollmentRepository
} from '@/enrollment/repositories/enrollment.repository'

@Injectable()
export class TypeOrmEnrollmentRepository implements EnrollmentRepository {
  constructor(
    @InjectRepository(Enrollment)
    private readonly repository: Repository<Enrollment>
  ) {}

  async findDistinctPrograms(): Promise<EnrollmentProgramRow[]> {
    return await this.repository
      .createQueryBuilder('enrollment')
      .select('enrollment.enrollment_program', 'enrollment_program')
      .distinct(true)
      .orderBy('enrollment.enrollment_program', 'ASC')
      .getRawMany()
  }

  async findByIdAndStudentId(
    id: number,
    studentId: number
  ): Promise<Enrollment | null> {
    return await this.repository.findOneBy({ id, student_id: studentId })
  }

  async findByStudentIdAndNumber(
    studentId: number,
    enrollmentNumber: string
  ): Promise<Enrollment | null> {
    return await this.repository.findOneBy({
      student_id: studentId,
      enrollment_number: enrollmentNumber
    })
  }

  async findByNumber(enrollmentNumber: string): Promise<Enrollment | null> {
    return await this.repository.findOneBy({
      enrollment_number: enrollmentNumber
    })
  }

  async create(data: Partial<Enrollment>): Promise<Enrollment> {
    return await this.repository.save(this.repository.create(data))
  }

  async update(id: number, data: Partial<Enrollment>): Promise<Enrollment> {
    return await this.repository.save({ ...data, id })
  }

  async deleteById(id: number): Promise<number> {
    const removed = await this.repository.delete(id)
    return removed.affected ?? 0
  }
}
