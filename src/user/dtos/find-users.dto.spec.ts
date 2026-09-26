import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { FindUsersDto } from './find-users.dto'

async function errorsFor(query: Record<string, unknown>) {
  const dto = plainToInstance(FindUsersDto, query)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('FindUsersDto', () => {
  it.each<[Record<string, string>, string]>([
    [{}, 'sem nenhum filtro'],
    [{ name: 'Ana' }, 'só o nome'],
    [{ email: 'ufba.br' }, 'só o e-mail'],
    [{ role: 'ADVISOR_WITH_ADMIN_PRIVILEGES' }, 'só o perfil']
  ])(
    'como todos os filtros são opcionais, aceita a consulta (%o, %s)',
    async (query) => {
      expect(await errorsFor(query)).toEqual([])
    }
  )

  it('remove os espaços das pontas do nome e do e-mail', () => {
    const dto = plainToInstance(FindUsersDto, {
      name: '  Ana ',
      email: ' ana@ufba.br  '
    })

    expect(dto).toMatchObject({ name: 'Ana', email: 'ana@ufba.br' })
  })

  it('quando o perfil não existe, recusa a consulta', async () => {
    expect(await errorsFor({ role: 'SUPERUSER' })).toEqual(['role'])
  })

  it.each([['name'], ['email']])(
    'quando o filtro %s passa de 80 caracteres, recusa a consulta',
    async (property) => {
      expect(await errorsFor({ [property]: 'a'.repeat(81) })).toEqual([
        property
      ])
    }
  )
})
