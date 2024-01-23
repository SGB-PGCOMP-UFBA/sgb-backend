import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { User } from '../../user/interfaces/user.interface'
import { Enrollment } from '../../enrollment/entities/enrollment.entity'

@Entity('advisor')
export class Advisor implements User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 14, nullable: false, unique: true })
  tax_id: string

  @Column({ length: 80, nullable: false })
  name: string

  @Column({ length: 80, nullable: false, unique: true })
  email: string

  @Column({ length: 11, nullable: false })
  phone_number: string

  @Column({ nullable: false })
  password: string

  @Column({ nullable: true, default: 'ADVISOR' })
  role: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => Enrollment, (enrollment) => enrollment.advisor)
  enrollments: Enrollment[]
}
