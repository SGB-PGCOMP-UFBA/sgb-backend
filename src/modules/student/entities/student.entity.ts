import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { User } from '../../../user/interface/user.interface'
import { Article } from '../../article/entities/article.entity'
import { Scholarship } from '../../scholarship/entities/scholarship.entity'

@Entity('student')
export class Student implements User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 14, nullable: false, unique: true })
  tax_id: string

  @Column({ length: 80, nullable: false })
  name: string

  @Column({ length: 80, nullable: false, unique: true })
  email: string

  @Column({ length: 80, nullable: false })
  link_to_lattes: string

  @Column({ length: 11, nullable: false })
  phone_number: string

  @Column({ nullable: false })
  password: string

  @Column({ nullable: false, default: 'STUDENT' })
  role: string

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Scholarship, (scholarship) => scholarship.student)
  scholarships: Scholarship[]

  @OneToMany(() => Article, (article) => article.student)
  articles: Article[]
}