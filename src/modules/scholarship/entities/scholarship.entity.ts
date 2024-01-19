import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Student } from '../../student/entities/student.entity'
import { Agency } from '../../agency/entities/agency.entity'
import { Advisor } from '../../../modules/advisor/entities/advisor.entity'

@Entity('scholarship')
export class Scholarship {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  student_id: number

  @Column({ nullable: false })
  agency_id: number

  @Column({ nullable: false })
  advisor_id: number

  @Column({ nullable: false })
  enrollment_date: Date

  @Column({ nullable: false })
  enrollment_number: string

  @Column({ nullable: false })
  enrollment_program: string

  @Column({ nullable: false })
  defense_prediction_date: Date

  @Column({ nullable: false })
  scholarship_started_at: Date

  @Column({ nullable: false })
  scholarship_ends_at: Date

  @Column({ nullable: false })
  extension_ends_at: Date

  @Column({ nullable: false })
  salary: number

  @Column({ nullable: false })
  active: boolean

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Student, (student) => student.scholarships)
  @JoinColumn({ name: 'student_id' })
  student: Student

  @ManyToOne(() => Agency, (agency) => agency.scholarships)
  @JoinColumn({ name: 'agency_id' })
  agency: Agency

  @ManyToOne(() => Advisor, (advisor) => advisor.scholarships)
  @JoinColumn({ name: 'advisor_id' })
  advisor: Advisor
}
