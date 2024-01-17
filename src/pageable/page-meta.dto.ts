export class PageMetaDto {
  readonly totalItems: number
  readonly itemCount: number
  readonly itemsPerPage: number
  readonly totalPages: number
  readonly currentPage: number

  constructor(
    totalItems: number,
    itemCount: number,
    itemsPerPage: number,
    totalPages: number,
    currentPage: number
  ) {
    this.totalItems = totalItems
    this.itemCount = itemCount
    this.itemsPerPage = itemsPerPage
    this.totalPages = totalPages
    this.currentPage = currentPage
  }
}
