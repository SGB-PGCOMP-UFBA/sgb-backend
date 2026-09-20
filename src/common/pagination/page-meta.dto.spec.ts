import { describe, expect, it } from 'vitest'
import { PageMetaDto } from './page-meta.dto'

describe('PageMetaDto', () => {
  it('quando o construtor recebe os números de paginação, guarda cada um na ordem posicional', () => {
    const meta = new PageMetaDto(97, 10, 10, 10, 3)

    expect(meta).toEqual({
      totalItems: 97,
      itemCount: 10,
      itemsPerPage: 10,
      totalPages: 10,
      currentPage: 3
    })
  })

  it('quando a página não tem nenhum resultado, mantém os zeros sem transformá-los', () => {
    const meta = new PageMetaDto(0, 0, 10, 0, 1)

    expect(meta.totalItems).toBe(0)
    expect(meta.itemCount).toBe(0)
    expect(meta.itemsPerPage).toBe(10)
    expect(meta.totalPages).toBe(0)
    expect(meta.currentPage).toBe(1)
  })
})
