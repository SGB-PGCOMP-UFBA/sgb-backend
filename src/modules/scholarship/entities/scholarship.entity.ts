import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Agency } from '../../agency/entities/agency.entity'
import { Enrollment } from '../../enrollment/entities/enrollment.entity'

@Entity('scholarship')
export class Scholarship {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  enrollment_id: number

  @Column({ nullable: false })
  agency_id: number

  @Column({ nullable: false })
  scholarship_starts_at: Date

  @Column({ nullable: false })
  scholarship_ends_at: Date

  @Column({ nullable: true })
  extension_ends_at: Date

  @Column({ nullable: true })
  salary: number

  @Column({ nullable: false, default: true })
  active: boolean

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
}
