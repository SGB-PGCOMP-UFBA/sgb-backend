import { ResponseScholarshipDto } from '../../scholarship/dto/response-scholarship.dto'
import { ResponseArticleDTO } from '../../article/dto/response-article.dto'

export class ResponseStudentDTO {
  constructor(
    id: number,
    tax_id: string,
    enrollment_number: string,
    name: string,
    email: string,
    course: string,
    link_lattes: string,
    advisor_id: number,
    enrollment_date_pgcomp: Date,
    defense_prediction: Date,
    phone_number: string,
    role: string,
    articles?: ResponseArticleDTO[],
    scholarship?: any
  ) {
    this.id = id
    this.tax_id = tax_id
    this.enrollment_number = enrollment_number
    this.name = name
    this.email = email
    this.course = course
    this.link_lattes = link_lattes
    this.advisor_id = advisor_id
    this.enrollment_date_pgcomp = enrollment_date_pgcomp
    this.defense_prediction = defense_prediction
    this.phone_number = phone_number
    this.role = role
    this.articles = articles
    this.scholarship = scholarship
  }

  readonly id: number
  readonly tax_id: string
  readonly enrollment_number: string
  readonly name: string
  readonly email: string
  readonly course: string
  readonly link_lattes: string
  readonly advisor_id: number
  readonly enrollment_date_pgcomp: Date
  readonly defense_prediction: Date
  readonly phone_number: string
  readonly role: string
  readonly articles: ResponseArticleDTO[]
  readonly scholarship: ResponseScholarshipDto
}
