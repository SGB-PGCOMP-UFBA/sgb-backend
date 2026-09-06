import { describe, expect, it } from 'vitest'
import { Advisor } from '../entities/advisor.entity'
import { AdvisorMapper } from './advisor.mapper'

function buildEnrollment(id: number) {
  return {
    id,
    student_id: id,
    advisor_id: 9,
    enrollment_date: new Date('2024-03-01'),
    enrollment_number: `20241234${id}`,
    enrollment_program: 'MESTRADO',
    defense_prediction_date: new Date('2026-03-01'),
    created_at: new Date('2024-03-01'),
    updated_at: new Date('2024-03-01')
  }
}

function buildAdvisor(overrides: Partial<Advisor> = {}): Advisor {
  return {
    id: 9,
    email: 'orientador@ufba.br',
    tax_id: '12345678901',
    phone_number: '71999999999',
    name: 'Beatriz Rocha',
    password: '$2a$10$hash-super-secreto',
    role: 'ADVISOR',
    status: 'ACTIVE',
    has_admin_privileges: false,
    created_at: new Date('2024-08-05'),
    updated_at: new Date('2024-08-06'),
    enrollments: [],
    ...overrides
  } as Advisor
}

describe('AdvisorMapper', () => {
  it.each([
    ['forFilter'],
    ['simplified'],
    ['detailed'],
    ['detailedWithRelations']
  ] as const)(
    'quando o orientador é mapeado, omite a senha (%s)',
    (formato) => {
      const saida = AdvisorMapper[formato](buildAdvisor())

      expect(saida).not.toHaveProperty('password')
      expect(JSON.stringify(saida)).not.toContain('hash-super-secreto')
    }
  )

  it.each([[true, 'ADVISOR_WITH_ADMIN_PRIVILEGES']])(
    'quando o orientador tem privilégio de admin, apresenta o papel ADVISOR_WITH_ADMIN_PRIVILEGES',
    (privilegio, papelEsperado) => {
      const advisor = buildAdvisor({ has_admin_privileges: privilegio })

      expect(AdvisorMapper.simplified(advisor).role).toBe(papelEsperado)
    }
  )

  it.each([[false, 'ADVISOR']])(
    'quando o orientador não tem privilégio de admin, apresenta o papel ADVISOR',
    (privilegio, papelEsperado) => {
      const advisor = buildAdvisor({ has_admin_privileges: privilegio })

      expect(AdvisorMapper.simplified(advisor).role).toBe(papelEsperado)
    }
  )

  it.each([[null], [undefined], ['']])(
    'quando o CPF e o telefone estão ausentes, normaliza os dois para null (%s)',
    (vazio) => {
      const detailed = AdvisorMapper.detailed(
        buildAdvisor({ tax_id: vazio as string, phone_number: vazio as string })
      )

      expect(detailed.tax_id).toBeNull()
      expect(detailed.phone_number).toBeNull()
    }
  )

  it('quando a relação de orientações está carregada, conta as orientações', () => {
    const advisor = buildAdvisor({
      enrollments: [buildEnrollment(1), buildEnrollment(2)] as never
    })

    expect(AdvisorMapper.detailed(advisor).enrollmentsCount).toBe(2)
  })

  it.each([[undefined], [null]])(
    'quando as orientações não foram carregadas, retorna contagem zero (%s)',
    (noRelation) => {
      const advisor = buildAdvisor({ enrollments: noRelation as never })

      expect(AdvisorMapper.detailed(advisor).enrollmentsCount).toBe(0)
    }
  )

  it('quando o orientador vira opção de filtro, usa o nome como chave e valor', () => {
    expect(AdvisorMapper.forFilter(buildAdvisor())).toEqual({
      id: 9,
      key: 'Beatriz Rocha',
      value: 'Beatriz Rocha',
      email: 'orientador@ufba.br'
    })
  })

  it('quando a relação está carregada, detalha as orientações do orientador', () => {
    const advisor = buildAdvisor({ enrollments: [buildEnrollment(1)] as never })

    const detalhado = AdvisorMapper.detailedWithRelations(advisor)

    expect(detalhado.enrollments).toHaveLength(1)
    expect(detalhado.enrollments[0]).toMatchObject({
      id: 1,
      enrollment_number: '202412341',
      enrollment_program: 'MESTRADO'
    })
  })
})
