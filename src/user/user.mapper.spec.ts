import { describe, expect, it } from 'vitest'
import { makeAdmin, makeAdvisor, makeStudent } from '@/common/testing/factories'
import {
  toManagedAdmin,
  toManagedAdvisor,
  toManagedStudent,
  toResponseUserDto
} from './user.mapper'

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

describe('mapeamento para a página de gerenciamento de usuários', () => {
  it('estudante sai com o Lattes e sem situação', () => {
    expect(
      toManagedStudent(
        makeStudent({ link_to_lattes: 'http://lattes.cnpq.br/1' })
      )
    ).toMatchObject({
      role: 'STUDENT',
      status: null,
      link_to_lattes: 'http://lattes.cnpq.br/1'
    })
  })

  it.each([
    [false, 'ADVISOR'],
    [true, 'ADVISOR_WITH_ADMIN_PRIVILEGES']
  ])(
    'orientador sai com o perfil de acordo com o privilégio de administrador (%s → %s)',
    (hasAdminPrivileges, role) => {
      expect(
        toManagedAdvisor(
          makeAdvisor({ has_admin_privileges: hasAdminPrivileges })
        )
      ).toMatchObject({ role, status: 'ACTIVE', link_to_lattes: null })
    }
  )

  it('administrador sai com o perfil ADMIN e a situação dele', () => {
    expect(toManagedAdmin(makeAdmin({ status: 'INACTIVE' }))).toMatchObject({
      role: 'ADMIN',
      status: 'INACTIVE',
      link_to_lattes: null
    })
  })

  it('CPF e telefone vazios saem como null', () => {
    expect(
      toManagedAdvisor(makeAdvisor({ tax_id: '', phone_number: '' }))
    ).toMatchObject({ tax_id: null, phone_number: null })
  })

  it('nunca inclui a senha', () => {
    for (const user of [
      toManagedStudent(makeStudent()),
      toManagedAdvisor(makeAdvisor()),
      toManagedAdmin(makeAdmin())
    ]) {
      expect(user).not.toHaveProperty('password')
    }
  })
})
