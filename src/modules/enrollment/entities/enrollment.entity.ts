import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Advisor } from '../../advisor/entities/advisor.entity'
import { Student } from '../../student/entities/student.entity'
import { Scholarship } from '../../scholarship/entities/scholarship.entity'

@Entity('enrollment')
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  student_id: number

  @Column({ nullable: false })
  advisor_id: number

  @Column({ nullable: false })
  enrollment_date: Date

  @Column({ nullable: false, length: 9 })
  enrollment_number: string

  @Column({ nullable: false, enum: ['MESTRADO', 'DOUTORADO'] })
  enrollment_program: string

  @Column({ nullable: true })
  defense_prediction_date: Date

  @Column({ nullable: false, default: true })
  active: boolean

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => Scholarship, (scholarship) => scholarship.enrollment)
  scholarships: Scholarship[]

  @ManyToOne(() => Student, (student) => student.enrollments)
  @JoinColumn({ name: 'student_id' })
  student: Student

  @ManyToOne(() => Advisor, (advisor) => advisor.enrollments)
  @JoinColumn({ name: 'advisor_id' })
  advisor: Advisor
}
