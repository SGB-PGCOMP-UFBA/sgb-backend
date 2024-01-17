import {
  ArticleEntity,
  toArticleResponseDTO
} from '../../article/entities/article.entity'
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { ResponseStudentDTO } from '../dto/student.response.dto'
import { Scholarship } from '../../scholarship/entities/scholarship.entity'
import { User } from '../../user/interface/user.interface'
import { Advisor } from '../../advisor/entities/advisor.entity'

@Entity('student')
export class StudentEntity implements User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 14, nullable: false, unique: true })
  tax_id: string

  @Column({ length: 10, nullable: false, unique: true })
  enrollment_number: string

  @Column({ nullable: false })
  name: string

  @Column({ nullable: false, unique: true })
  email: string

  @Column({ nullable: false })
  course: string

  @Column({ nullable: false })
  link_lattes: string

  @Column()
  advisor_id: number

  @Column({ nullable: false, type: 'date' })
  enrollment_date_pgcomp: Date

  @Column({ length: 11, nullable: false })
  phone_number: string

  @Column({ nullable: false })
  password: string

  @Column({ nullable: true, default: 'STUDENT' })
  role: string

  @OneToMany(() => ArticleEntity, (article) => article.student)
  articles: ArticleEntity[]

  @OneToOne(() => Scholarship, (scholarship) => scholarship.student)
  scolarship: Scholarship

  @OneToOne(() => Advisor, (advisor) => advisor.student)
  advisor: Advisor

  @Column()
  defense_prediction: Date
}

export function toStudentResponseDTO(
  student: StudentEntity
): ResponseStudentDTO {
  return new ResponseStudentDTO(
    student.id,
    student.tax_id,
    student.enrollment_number,
    student.name,
    student.email,
    student.course,
    student.link_lattes,
    student.advisor_id,
    student.enrollment_date_pgcomp,
    student.defense_prediction,
    student.phone_number,
    student.role,
    student.articles.map((article) => toArticleResponseDTO(article)),
    student.scolarship
  )
}
