import { describe, expect, it } from 'vitest'
import { makeStudent } from '@/core/testing/factories'
import { toResponseUserDto } from './user.mapper'

describe('toResponseUserDto', () => {
  it('quando o usuário é mapeado, omite a senha da resposta', () => {
    const dto = toResponseUserDto(
      makeStudent({ password: '$2a$10$hash-super-secreto' })
    )

    expect(dto).not.toHaveProperty('password')
    expect(JSON.stringify(dto)).not.toContain('hash-super-secreto')
  })

  it('quando o usuário é mapeado, preenche cada campo com o dado correspondente', () => {
    const dto = toResponseUserDto(
      makeStudent({ name: 'Ana Souza', email: 'ana@ufba.br' })
    )

    expect(dto).toEqual({
      id: 7,
      tax_id: '12345678901',
      name: 'Ana Souza',
      role: 'STUDENT',
      email: 'ana@ufba.br',
      phone_number: '71999999999'
    })
  })

  it('quando o usuário é mapeado, omite as datas de auditoria do registro', () => {
    const dto = toResponseUserDto(makeStudent())

    expect(Object.keys(dto).sort()).toEqual([
      'email',
      'id',
      'name',
      'phone_number',
      'role',
      'tax_id'
    ])
  })
})
