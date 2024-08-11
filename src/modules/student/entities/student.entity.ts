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

@Entity('student')
export class Student implements User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 11, nullable: true, unique: true })
  tax_id: string

  @Column({ length: 11, nullable: true, unique: true })
  phone_number: string

  @Column({ length: 80, nullable: false })
  name: string

  @Column({ length: 80, nullable: false, unique: true })
  email: string

  @Column({ length: 80, nullable: false, unique: true })
  link_to_lattes: string

  @Column({ nullable: false })
  password: string

  @Column({ nullable: false, default: 'STUDENT' })
  role: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[]
}
