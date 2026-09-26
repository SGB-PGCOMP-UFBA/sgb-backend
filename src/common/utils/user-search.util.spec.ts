import { describe, expect, it } from 'vitest'
import { ILike } from 'typeorm'
import { userSearchWhere } from './user-search.util'

describe('userSearchWhere', () => {
  it('sem filtros, não restringe a busca', () => {
    expect(userSearchWhere({})).toEqual({})
  })

  it('busca nome e e-mail por trecho, sem diferenciar maiúsculas', () => {
    expect(userSearchWhere({ name: 'ana', email: 'ufba' })).toEqual({
      name: ILike('%ana%'),
      email: ILike('%ufba%')
    })
  })

  it('ignora filtro vazio', () => {
    expect(userSearchWhere({ name: '', email: 'ufba' })).toEqual({
      email: ILike('%ufba%')
    })
  })
})
