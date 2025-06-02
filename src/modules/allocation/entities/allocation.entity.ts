import { Scholarship } from '../../scholarship/entities/scholarship.entity'
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

  @Column({ nullable: false, default: 0 })
  masters_degree_awarded_scholarships: number

  @Column({ nullable: false, default: 0 })
  doctorate_degree_awarded_scholarships: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => Scholarship, (scholarship) => scholarship.allocation)
  scholarships: Scholarship[]
}
