import { Type } from 'class-transformer'
import { IsString, IsUrl, IsDate, IsNumber } from 'class-validator'

export class CreateArticleDto {
  constructor(
    student_id: number,
    title: string,
    publication_date: Date,
    publication_place: string,
    doi_link: string
  ) {
    this.student_id = student_id
    this.title = title
    this.publication_date = publication_date
    this.publication_place = publication_place
    this.doi_link = doi_link
  }

  @IsNumber() readonly student_id: number
  @IsString() readonly title: string
  @IsDate() @Type(() => Date) readonly publication_date: Date
  @IsString() readonly publication_place: string
  @IsUrl() readonly doi_link: string
}
