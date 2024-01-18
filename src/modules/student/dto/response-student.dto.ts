import { toArticleResponseDto } from '../../article/mapper/article.mapper'
import { ResponseArticleDto } from '../../article/dto/response-article.dto'
import { Student } from '../entities/student.entity'

export class ResponseStudentDto {
  constructor(student: Student) {
    this.id = student.id
    this.tax_id = student.tax_id
    this.name = student.name
    this.email = student.email
    this.phone_number = student.phone_number
    this.link_to_lattes = student.link_to_lattes
    this.role = student.role
    this.created_at = student.created_at
    this.updated_at = student.updated_at
    this.articles = student.articles?.map((article) => toArticleResponseDto(article))
  }

  readonly id: number
  readonly tax_id: string
  readonly name: string
  readonly email: string
  readonly link_to_lattes: string
  readonly phone_number: string
  readonly role: string
  readonly created_at: Date
  readonly updated_at: Date
  readonly articles: ResponseArticleDto[]
}
