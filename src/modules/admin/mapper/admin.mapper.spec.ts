import { describe, expect, it } from 'vitest'
import { makeAdmin } from '@/core/testing/factories'
import { AdminMapper } from './admin.mapper'

describe('AdminMapper', () => {
  it.each([['simplified'], ['detailed']] as const)(
    'quando o administrador é mapeado, omite a senha (%s)',
    (format) => {
      const saida = AdminMapper[format](
        makeAdmin({ password: '$2a$10$hash-super-secreto' })
      )

      expect(saida).not.toHaveProperty('password')
      expect(JSON.stringify(saida)).not.toContain('hash-super-secreto')
    }
  )

  it('quando o formato é simplified, expõe apenas identificação e situação, sem dados pessoais', () => {
    expect(Object.keys(AdminMapper.simplified(makeAdmin())).sort()).toEqual([
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
        makeAdmin({ tax_id: empty as string, phone_number: empty as string })
      )

      expect(detailed.tax_id).toBeNull()
      expect(detailed.phone_number).toBeNull()
    }
  )

  it('quando o formato é detailed, acrescenta contato e identificação ao simplificado', () => {
    const admin = makeAdmin()

    expect(AdminMapper.detailed(admin)).toEqual({
      ...AdminMapper.simplified(admin),
      tax_id: '12345678901',
      phone_number: '71999999999',
      name: 'Carlos Lima',
      email: 'carlos@ufba.br'
    })
  })
})
