import { describe, expect, it } from 'vitest'
import {
  makeAdmin,
  makeAdvisor,
  makeEnrollment,
  makeStudent
} from '@/common/testing/factories'
import {
  toAdvisorFilterOption,
  toAdvisorSummary,
  toManagedUser,
  toResponseUserDto,
  toStudentSummary,
  toStudentWithEnrollments
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

describe('toManagedUser', () => {
  it('estudante sai com o Lattes e sem situação', () => {
    expect(
      toManagedUser(
        makeStudent({ link_to_lattes: 'http://lattes.cnpq.br/1', status: 'X' })
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
        toManagedUser(
          makeAdvisor({
            has_admin_privileges: hasAdminPrivileges,
            link_to_lattes: 'sobra'
          })
        )
      ).toMatchObject({ role, status: 'ACTIVE', link_to_lattes: null })
    }
  )

  it('administrador sai com o perfil ADMIN e a situação dele', () => {
    expect(toManagedUser(makeAdmin({ status: 'INACTIVE' }))).toMatchObject({
      role: 'ADMIN',
      status: 'INACTIVE',
      link_to_lattes: null
    })
  })

  it('CPF e telefone vazios saem como null', () => {
    expect(
      toManagedUser(makeAdvisor({ tax_id: '', phone_number: '' }))
    ).toMatchObject({ tax_id: null, phone_number: null })
  })

  it('nunca inclui a senha', () => {
    for (const user of [makeStudent(), makeAdvisor(), makeAdmin()]) {
      expect(toManagedUser(user)).not.toHaveProperty('password')
    }
  })
})

describe('toResponseUserDto com orientador', () => {
  it('usa o perfil de orientador administrador quando há privilégio', () => {
    expect(
      toResponseUserDto(makeAdvisor({ has_admin_privileges: true })).role
    ).toBe('ADVISOR_WITH_ADMIN_PRIVILEGES')
  })
})

describe('toAdvisorSummary', () => {
  it('conta as orientações quando a relação está carregada', () => {
    const advisor = makeAdvisor({
      advised_enrollments: makeEnrollment.list(2, (index) => ({
        id: index + 1
      }))
    })

    expect(toAdvisorSummary(advisor).enrollmentsCount).toBe(2)
  })

  it.each([[undefined], [null]])(
    'quando as orientações não foram carregadas, conta zero (%s)',
    (notLoaded) => {
      const advisor = makeAdvisor({ advised_enrollments: notLoaded as never })

      expect(toAdvisorSummary(advisor).enrollmentsCount).toBe(0)
    }
  )

  it('mantém o formato que a tela de orientadores e as bolsas consomem', () => {
    expect(
      toAdvisorSummary(makeAdvisor({ has_admin_privileges: true }))
    ).toEqual({
      id: 10,
      role: 'ADVISOR_WITH_ADMIN_PRIVILEGES',
      status: 'ACTIVE',
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
      tax_id: '98765432100',
      phone_number: '71988888888',
      name: 'Orientadora Teste',
      email: 'orientadora@ufba.br',
      enrollmentsCount: 0,
      has_admin_privileges: true
    })
  })
})

describe('toAdvisorFilterOption', () => {
  it('usa o nome como chave e valor', () => {
    expect(toAdvisorFilterOption(makeAdvisor())).toEqual({
      id: 10,
      key: 'Orientadora Teste',
      value: 'Orientadora Teste',
      email: 'orientadora@ufba.br'
    })
  })
})

describe('toStudentSummary', () => {
  it('traz os dados cadastrais sem a senha', () => {
    const summary = toStudentSummary(makeStudent())

    expect(summary).toMatchObject({
      id: 7,
      role: 'STUDENT',
      name: 'Aluno Teste',
      link_to_lattes: 'http://lattes.cnpq.br/1'
    })
    expect(summary).not.toHaveProperty('password')
  })
})

describe('toStudentWithEnrollments', () => {
  it('detalha as matrículas com o orientador de cada uma', () => {
    const student = makeStudent({
      enrollments: [makeEnrollment({ id: 42, enrollment_number: '202412341' })]
    })

    const [enrollment] = toStudentWithEnrollments(student).enrollments

    expect(enrollment).toMatchObject({
      id: 42,
      enrollment_number: '202412341',
      advisor: { name: 'Orientadora Teste' }
    })
  })
})
