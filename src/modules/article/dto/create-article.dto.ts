import { Type } from 'class-transformer'
import { IsString, IsUrl, IsDate, IsNumber, MaxLength } from 'class-validator'

export class CreateArticleDto {
  @IsNumber()
  readonly student_id: number

  @IsString()
  @MaxLength(300)
  readonly title: string

  @IsString()
  @MaxLength(3000)
  readonly abstract: string

  @IsDate()
  @Type(() => Date)
  readonly publication_date: Date

  @IsString()
  @MaxLength(100)
  readonly publication_place: string

  @IsUrl()
  @MaxLength(255)
  readonly doi_link: string
}
