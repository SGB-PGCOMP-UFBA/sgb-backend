import { toArticleResponseDto } from '../../../modules/article/mapper/article.mapper'
import { ResponseArticleDto } from '../../../modules/article/dto/response-article.dto'
import { Student } from '../entities/students.entity'

export class ResponseStudentDto {
  constructor(student: Student) {
    this.id = student.id
    this.tax_id = student.tax_id
    this.name = student.name
    this.email = student.email
    this.phone_number = student.phone_number
    this.link_lattes = student.link_lattes
    this.role = student.role
    this.created_at = student.created_at
    this.updated_at = student.updated_at
    this.article = student.articles.map((article) => toArticleResponseDto(article))
  }

  readonly id: number
  readonly tax_id: string
  readonly name: string
  readonly email: string
  readonly link_lattes: string
  readonly phone_number: string
  readonly role: string
  readonly created_at: Date
  readonly updated_at: Date
  readonly article: ResponseArticleDto[]
}
