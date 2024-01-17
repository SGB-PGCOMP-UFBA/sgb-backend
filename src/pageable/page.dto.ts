import { IsArray } from 'class-validator'
import { PageMetaDto } from './page-meta.dto'

export class PageDto<T> {
  @IsArray()
  readonly items: T[]

  readonly meta: PageMetaDto

  constructor(items: T[], meta: PageMetaDto) {
    this.items = items
    this.meta = meta
  }
}
