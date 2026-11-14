import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import type { CalendarDay } from '@/common/utils/calendar-day.util'
import { User } from '@/user/entities/user.entity'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'

@Entity('enrollment')
@Index('UQ_ENROLLMENT_NUMBER', ['enrollment_number'], {
  unique: true,
  where: `"deleted_at" IS NULL`
})
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  student_id: number

  @Column({ nullable: false })
  advisor_id: number

  @Column({ type: 'date', nullable: false })
  enrollment_date: CalendarDay

  @Column({ nullable: false, length: 15 })
  enrollment_number: string

  @Column({ nullable: false, enum: ['MESTRADO', 'DOUTORADO'] })
  enrollment_program: string

  @Column({ type: 'date', nullable: true })
  defense_prediction_date: CalendarDay | null

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null

  @OneToMany(() => Scholarship, (scholarship) => scholarship.enrollment)
  scholarships: Scholarship[]

  @ManyToOne(() => User, (student) => student.enrollments)
  @JoinColumn({ name: 'student_id' })
  student: User

  @ManyToOne(() => User, (advisor) => advisor.advised_enrollments)
  @JoinColumn({ name: 'advisor_id' })
  advisor: User
}
