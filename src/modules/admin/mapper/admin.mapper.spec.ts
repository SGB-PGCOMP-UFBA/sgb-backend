import { describe, expect, it } from 'vitest'
import { Admin } from '../entities/admin.entity'
import { AdminMapper } from './admin.mapper'

function buildAdmin(overrides: Partial<Admin> = {}): Admin {
  return {
    id: 3,
    name: 'Carlos Lima',
    tax_id: '12345678901',
    phone_number: '71999999999',
    email: 'carlos@ufba.br',
    password: '$2a$10$hash-super-secreto',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date('2024-08-05'),
    updated_at: new Date('2024-08-06'),
    ...overrides
  } as Admin
}

describe('AdminMapper', () => {
  it.each([['simplified'], ['detailed']] as const)(
    'quando o administrador é mapeado, omite a senha (%s)',
    (format) => {
      const saida = AdminMapper[format](buildAdmin())

      expect(saida).not.toHaveProperty('password')
      expect(JSON.stringify(saida)).not.toContain('hash-super-secreto')
    }
  )

  it('quando o formato é simplified, expõe apenas identificação e situação, sem dados pessoais', () => {
    expect(Object.keys(AdminMapper.simplified(buildAdmin())).sort()).toEqual([
      'created_at',
      'id',
      'role',
      'status',
      'updated_at'
    ])
  })

  it.each([[null], [undefined], ['']])(
    'quando o CPF e o telefone estão ausentes, normaliza os dois para null (%s)',
    (empty) => {
      const detailed = AdminMapper.detailed(
        buildAdmin({ tax_id: empty as string, phone_number: empty as string })
      )

      expect(detailed.tax_id).toBeNull()
      expect(detailed.phone_number).toBeNull()
    }
  )

  it('quando o formato é detailed, acrescenta contato e identificação ao simplificado', () => {
    const admin = buildAdmin()

    expect(AdminMapper.detailed(admin)).toEqual({
      ...AdminMapper.simplified(admin),
      tax_id: '12345678901',
      phone_number: '71999999999',
      name: 'Carlos Lima',
      email: 'carlos@ufba.br'
    })
  })
})
