import { describe, expect, it } from 'vitest'
import { makeAdvisor, makeEnrollment } from '@/core/testing/factories'
import { AdvisorMapper } from './advisor.mapper'

describe('AdvisorMapper', () => {
  it.each([
    ['forFilter'],
    ['simplified'],
    ['detailed'],
    ['detailedWithRelations']
  ] as const)(
    'quando o orientador é mapeado, omite a senha (%s)',
    (formato) => {
      const saida = AdvisorMapper[formato](
        makeAdvisor({ password: '$2a$10$hash-super-secreto' })
      )

      expect(saida).not.toHaveProperty('password')
      expect(JSON.stringify(saida)).not.toContain('hash-super-secreto')
    }
  )

  it.each([[true, 'ADVISOR_WITH_ADMIN_PRIVILEGES']])(
    'quando o orientador tem privilégio de admin, apresenta o papel ADVISOR_WITH_ADMIN_PRIVILEGES',
    (privilegio, papelEsperado) => {
      const advisor = makeAdvisor({ has_admin_privileges: privilegio })

      expect(AdvisorMapper.simplified(advisor).role).toBe(papelEsperado)
    }
  )

  it.each([[false, 'ADVISOR']])(
    'quando o orientador não tem privilégio de admin, apresenta o papel ADVISOR',
    (privilegio, papelEsperado) => {
      const advisor = makeAdvisor({ has_admin_privileges: privilegio })

      expect(AdvisorMapper.simplified(advisor).role).toBe(papelEsperado)
    }
  )

  it.each([[null], [undefined], ['']])(
    'quando o CPF e o telefone estão ausentes, normaliza os dois para null (%s)',
    (vazio) => {
      const detailed = AdvisorMapper.detailed(
        makeAdvisor({ tax_id: vazio as string, phone_number: vazio as string })
      )

      expect(detailed.tax_id).toBeNull()
      expect(detailed.phone_number).toBeNull()
    }
  )

  it('quando a relação de orientações está carregada, conta as orientações', () => {
    const advisor = makeAdvisor({
      enrollments: makeEnrollment.list(2, (index) => ({ id: index + 1 }))
    })

    expect(AdvisorMapper.detailed(advisor).enrollmentsCount).toBe(2)
  })

  it.each([[undefined], [null]])(
    'quando as orientações não foram carregadas, retorna contagem zero (%s)',
    (noRelation) => {
      const advisor = makeAdvisor({ enrollments: noRelation as never })

      expect(AdvisorMapper.detailed(advisor).enrollmentsCount).toBe(0)
    }
  )

  it('quando o orientador vira opção de filtro, usa o nome como chave e valor', () => {
    expect(
      AdvisorMapper.forFilter(
        makeAdvisor({
          id: 9,
          name: 'Beatriz Rocha',
          email: 'orientador@ufba.br'
        })
      )
    ).toEqual({
      id: 9,
      key: 'Beatriz Rocha',
      value: 'Beatriz Rocha',
      email: 'orientador@ufba.br'
    })
  })

  it('quando a relação está carregada, detalha as orientações do orientador', () => {
    const advisor = makeAdvisor({
      enrollments: [makeEnrollment({ id: 1, enrollment_number: '202412341' })]
    })

    const detalhado = AdvisorMapper.detailedWithRelations(advisor)

    expect(detalhado.enrollments).toHaveLength(1)
    expect(detalhado.enrollments[0]).toMatchObject({
      id: 1,
      enrollment_number: '202412341',
      enrollment_program: 'MESTRADO'
    })
  })
})
