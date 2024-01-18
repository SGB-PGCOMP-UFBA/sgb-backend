import { Type } from 'class-transformer'
import { IsString, IsUrl, IsDate, IsNumber } from 'class-validator'

export class CreateArticleDto {
  @IsNumber() 
  readonly student_id: number

  @IsString() 
  readonly title: string

  @IsDate()
  @Type(() => Date) 
  readonly publication_date: Date

  @IsString() 
  readonly publication_place: string

  @IsUrl()
  readonly doi_link: string
}
