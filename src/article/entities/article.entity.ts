import { StudentEntity } from '../../students/entities/students.entity'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { ResponseArticleDTO } from '../dto/response-article.dto'

@Entity('article')
export class ArticleEntity {
  @PrimaryGeneratedColumn() id: number

  @Column({ nullable: false })
  student_id: number

  @Column({ nullable: false }) title: string
  @Column({ nullable: false }) publication_date: Date
  @Column({ nullable: false }) publication_place: string
  @Column({ nullable: false }) doi_link: string

  @ManyToOne(() => StudentEntity, (student) => student.articles)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity
}

export function toArticleResponseDTO(
  article: ArticleEntity
): ResponseArticleDTO {
  return new ResponseArticleDTO(
    article.id,
    article.student_id,
    article.title,
    article.publication_date,
    article.publication_place,
    article.doi_link
  )
}
