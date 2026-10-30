import {
  Column,
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import type { CalendarDay } from '@/common/utils/calendar-day.util'
import { Agency } from '@/agency/entities/agency.entity'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { Allocation } from '@/allocation/entities/allocation.entity'

@Entity('scholarship')
export class Scholarship {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  enrollment_id: number

  @Column({ nullable: false })
  agency_id: number

  @Column({ nullable: true, default: null })
  allocation_id: number

  @Column({ type: 'date', nullable: false })
  scholarship_starts_at: CalendarDay

  @Column({ type: 'date', nullable: false })
  scholarship_ends_at: CalendarDay

  @Column({ type: 'date', nullable: true })
  extension_ends_at: CalendarDay | null

  @Column({ nullable: true })
  salary: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.scholarships)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment

  @ManyToOne(() => Agency, (agency) => agency.scholarships)
  @JoinColumn({ name: 'agency_id' })
  agency: Agency

  @ManyToOne(() => Allocation, (allocation) => allocation.scholarships)
  @JoinColumn({ name: 'allocation_id' })
  allocation: Allocation
}
