import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('allocation')
export class Allocation {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  name: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null

  @OneToMany(() => Scholarship, (scholarship) => scholarship.allocation)
  scholarships: Scholarship[]
}
