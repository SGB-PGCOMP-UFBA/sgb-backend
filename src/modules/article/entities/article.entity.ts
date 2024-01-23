import { Student } from '../../student/entities/student.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('article')
export class Article {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  student_id: number

  @Column({ nullable: false })
  title: string

  @Column({ nullable: false })
  abstract: string

  @Column({ nullable: false })
  publication_date: Date

  @Column({ nullable: false })
  publication_place: string

  @Column({ nullable: false })
  doi_link: string

  @ManyToOne(() => Student, (student) => student.articles)
  @JoinColumn({ name: 'student_id' })
  student: Student

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
