import { Article } from "../entities/article.entity"

export class ResponseArticleDto {
  constructor(article: Article) {
    this.id = article.id
    this.student_id = article.student_id
    this.title = article.title
    this.abstract = article.abstratc
    this.publication_date = article.publication_date
    this.publication_place = article.publication_place
    this.doi_link = article.doi_link
    this.created_at = article.created_at
    this.updated_at = article.updated_at
  }

  readonly id: number
  readonly student_id: number
  readonly title: string
  readonly abstract: string
  readonly publication_date: Date
  readonly publication_place: string
  readonly doi_link: string
  readonly created_at: Date
  readonly updated_at: Date
}
