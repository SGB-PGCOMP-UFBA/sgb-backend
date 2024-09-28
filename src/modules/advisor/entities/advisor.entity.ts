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

  @Column({ length: 11, nullable: true, unique: true })
  tax_id: string

  @Column({ length: 11, nullable: true, unique: true })
  phone_number: string

  @Column({ length: 80, nullable: false })
  name: string

  @Column({ length: 50, nullable: false, unique: true })
  email: string

  @Column({ nullable: false })
  password: string

  @Column({ nullable: false, default: 'ADVISOR' })
  role: string

  @Column({ nullable: false, default: 'ACTIVE' })
  status: string

  @Column({ nullable: false, default: false })
  has_admin_privileges: boolean

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => Enrollment, (enrollment) => enrollment.advisor)
  enrollments: Enrollment[]
}
