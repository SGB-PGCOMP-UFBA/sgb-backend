import { describe, expect, it } from 'vitest'
import { User } from '../interfaces/user.interface'
import { toResponseUserDto } from './user.mapper'

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    tax_id: '12345678901',
    name: 'Ana Souza',
    email: 'ana@ufba.br',
    password: '$2a$10$hash-super-secreto',
    phone_number: '71999999999',
    role: 'STUDENT',
    created_at: new Date('2024-08-05'),
    updated_at: new Date('2024-08-06'),
    ...overrides
  }
}

describe('toResponseUserDto', () => {
  it('quando o usuário é mapeado, omite a senha da resposta', () => {
    const dto = toResponseUserDto(buildUser())

    expect(dto).not.toHaveProperty('password')
    expect(JSON.stringify(dto)).not.toContain('hash-super-secreto')
  })

  it('quando o usuário é mapeado, preenche cada campo com o dado correspondente', () => {
    const dto = toResponseUserDto(buildUser())

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
    const dto = toResponseUserDto(buildUser())

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
