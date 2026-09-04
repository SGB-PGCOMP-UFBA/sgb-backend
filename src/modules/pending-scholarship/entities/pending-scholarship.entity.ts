import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('pending_scholarship')
export class PendingScholarship {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 80, nullable: false })
  student_name: string

  @Column({ length: 11, nullable: false })
  tax_id: string

  @Column({ nullable: false, enum: ['MESTRADO', 'DOUTORADO'] })
  enrollment_program: string

  @Column({ nullable: false })
  agency: string

  @Column({ nullable: false })
  scholarship_starts_at: Date

  @Column({ nullable: false })
  scholarship_ends_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
