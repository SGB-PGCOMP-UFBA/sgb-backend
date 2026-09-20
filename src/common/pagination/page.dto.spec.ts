import { describe, expect, it } from 'vitest'
import { PageMetaDto } from './page-meta.dto'
import { PageDto } from './page.dto'

describe('PageDto', () => {
  it('quando recebe itens e meta, envolve os dois sem alterá-los', () => {
    const meta = new PageMetaDto(2, 2, 10, 1, 1)
    const itens = [{ id: 1 }, { id: 2 }]

    const page = new PageDto(itens, meta)

    expect(page.items).toBe(itens)
    expect(page.meta).toBe(meta)
  })

  it('quando a lista de itens está vazia, preserva a lista vazia', () => {
    const page = new PageDto([], new PageMetaDto(0, 0, 10, 0, 1))

    expect(page.items).toEqual([])
    expect(page.meta.totalItems).toBe(0)
  })
})
