import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import {
  EnrollmentProgramRow,
  EnrollmentRepository
} from '@/enrollment/repositories/enrollment.repository'
import {
  occupiesSlotSql,
  todayAsCalendarDay
} from '@/scholarship/utils/scholarship-status.util'

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

  async findByNumberWithActiveScholarships(
    enrollmentNumber: string
  ): Promise<Enrollment | null> {
    return await this.repository
      .createQueryBuilder('enrollment')
      .addSelect([
        'scholarships.id',
        'scholarships.scholarship_starts_at',
        'scholarships.scholarship_ends_at',
        'scholarships.extension_ends_at',
        'student.email',
        'student.name'
      ])
      .leftJoin(
        'enrollment.scholarships',
        'scholarships',
        occupiesSlotSql('scholarships'),
        { today: todayAsCalendarDay() }
      )
      .leftJoin('enrollment.student', 'student')
      .where(`enrollment.enrollment_number = :enrollmentNumber`, {
        enrollmentNumber
      })
      .getOne()
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

  async deleteAllAndResetSequence(): Promise<void> {
    await this.repository.createQueryBuilder().delete().execute()
    await this.repository.query(
      `ALTER SEQUENCE enrollment_id_seq RESTART WITH 1`
    )
  }
}
