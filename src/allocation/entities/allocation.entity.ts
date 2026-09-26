import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import {
  Column,
  CreateDateColumn,
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

  @OneToMany(() => Scholarship, (scholarship) => scholarship.allocation)
  scholarships: Scholarship[]
}
