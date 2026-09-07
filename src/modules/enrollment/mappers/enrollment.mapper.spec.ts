import { describe, expect, it } from 'vitest'
import { ProgramEnum } from '../../../core/enums/ProgramEnum'
import { Enrollment } from '../entities/enrollment.entity'
import { EnrollmentMapper } from './enrollment.mapper'

function buildAdvisor(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    name: 'Orientadora Teste',
    email: 'orientadora@ufba.br',
    role: 'ADVISOR',
    status: 'ACTIVE',
    has_admin_privileges: false,
    tax_id: null,
    phone_number: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides
  }
}

function buildStudent(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: 'Aluno Teste',
    email: 'aluno@ufba.br',
    role: 'STUDENT',
    link_to_lattes: 'http://lattes.cnpq.br/1',
    tax_id: '123.456.789-00',
    phone_number: '71999999999',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides
  }
}

function buildScholarship(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    agency_id: 1,
    allocation_id: 2,
    enrollment_id: 42,
    status: 'ON_GOING',
    scholarship_starts_at: new Date('2024-03-01'),
    scholarship_ends_at: new Date('2026-02-28'),
    extension_ends_at: null,
    salary: 2100,
    created_at: new Date('2024-03-01'),
    updated_at: new Date('2024-03-01'),
    ...overrides
  }
}

function buildEnrollment(overrides: Record<string, unknown> = {}): Enrollment {
  return {
    id: 42,
    student_id: 7,
    advisor_id: 10,
    enrollment_date: new Date('2024-03-01'),
    enrollment_number: '2024123456',
    enrollment_program: 'MESTRADO',
    defense_prediction_date: new Date('2026-03-01'),
    created_at: new Date('2024-03-02'),
    updated_at: new Date('2024-03-03'),
    ...overrides
  } as Enrollment
}

describe('EnrollmentMapper.forFilter', () => {
  it.each([
    ['MESTRADO', ProgramEnum.MESTRADO],
    ['DOUTORADO', ProgramEnum.DOUTORADO]
  ])(
    'quando monta a opção de filtro, traduz o programa para o rótulo exibido (%s)',
    (program, label) => {
      const option = EnrollmentMapper.forFilter(
        buildEnrollment({ enrollment_program: program })
      )

      expect(option).toEqual({ key: program, value: label })
    }
  )
})

describe('EnrollmentMapper.simplified', () => {
  it('quando mapeia a matrícula, expõe apenas identificadores e timestamps', () => {
    const simplified = EnrollmentMapper.simplified(buildEnrollment())

    expect(Object.keys(simplified).sort()).toEqual([
      'advisor_id',
      'created_at',
      'id',
      'student_id',
      'updated_at'
    ])
  })

  it('quando mapeia a matrícula, omite número, programa e datas acadêmicas', () => {
    const simplified = EnrollmentMapper.simplified(buildEnrollment()) as Record<
      string,
      unknown
    >

    expect(simplified.enrollment_number).toBeUndefined()
    expect(simplified.enrollment_program).toBeUndefined()
    expect(simplified.enrollment_date).toBeUndefined()
    expect(simplified.defense_prediction_date).toBeUndefined()
  })
})

describe('EnrollmentMapper.detailed', () => {
  it('quando mapeia a matrícula, acrescenta os dados acadêmicos sem perder os do simplified', () => {
    const enrollment = buildEnrollment()

    const detailed = EnrollmentMapper.detailed(enrollment)

    expect(detailed).toMatchObject({
      id: 42,
      student_id: 7,
      advisor_id: 10,
      enrollment_number: '2024123456',
      enrollment_program: 'MESTRADO',
      enrollment_date: enrollment.enrollment_date,
      defense_prediction_date: enrollment.defense_prediction_date
    })
  })

  it.each([
    ['string vinda do driver', '2024-03-01'],
    ['objeto Date', new Date('2024-03-01T00:00:00.000Z')]
  ])(
    'quando a data de matrícula vem da entidade, repassa sem converter (%s)',
    (_caso, valor) => {
      const detailed = EnrollmentMapper.detailed(
        buildEnrollment({ enrollment_date: valor })
      )

      expect(detailed.enrollment_date).toBe(valor)
    }
  )

  it('quando a previsão de defesa não foi informada, mantém o valor nulo', () => {
    const detailed = EnrollmentMapper.detailed(
      buildEnrollment({ defense_prediction_date: null })
    )

    expect(detailed.defense_prediction_date).toBeNull()
  })
})

describe('EnrollmentMapper.detailedWithRelations', () => {
  it('quando orientador e aluno não foram carregados, devolve null para os dois', () => {
    const withRelations = EnrollmentMapper.detailedWithRelations(
      buildEnrollment({ advisor: undefined, student: undefined })
    )

    expect(withRelations.advisor).toBeNull()
    expect(withRelations.student).toBeNull()
  })

  it('quando as relações vieram carregadas, mapeia orientador e aluno', () => {
    const withRelations = EnrollmentMapper.detailedWithRelations(
      buildEnrollment({ advisor: buildAdvisor(), student: buildStudent() })
    )

    expect(withRelations.advisor).toMatchObject({
      id: 10,
      email: 'orientadora@ufba.br'
    })
    expect(withRelations.student).toMatchObject({
      id: 7,
      email: 'aluno@ufba.br'
    })
  })

  it('quando a matrícula traz bolsas carregadas, mapeia cada uma pelo detalhamento simples', () => {
    const withRelations = EnrollmentMapper.detailedWithRelations(
      buildEnrollment({
        scholarships: [
          buildScholarship({ id: 100, status: 'ON_GOING' }),
          buildScholarship({ id: 101, status: 'FINISHED' })
        ]
      })
    )

    expect(withRelations.scholarships).toHaveLength(2)
    expect(withRelations.scholarships[0]).toMatchObject({
      id: 100,
      status: 'ON_GOING',
      salary: 2100
    })
    expect(withRelations.scholarships[0]).not.toHaveProperty('agency')
  })

  it('quando a relação de bolsas não foi carregada, deixa o campo indefinido', () => {
    const withRelations = EnrollmentMapper.detailedWithRelations(
      buildEnrollment({ scholarships: undefined })
    )

    expect(withRelations.scholarships).toBeUndefined()
  })
})

describe('EnrollmentMapper.detailedWithFullRelations', () => {
  it('quando as bolsas trazem agência e alocação, aninha as duas no resultado', () => {
    const withFullRelations = EnrollmentMapper.detailedWithFullRelations(
      buildEnrollment({
        advisor: buildAdvisor(),
        scholarships: [
          buildScholarship({
            agency: { id: 1, name: 'CAPES', description: 'Agência' },
            allocation: { id: 2, name: 'REMOTO' }
          })
        ]
      })
    )

    expect(withFullRelations.scholarships[0]).toMatchObject({
      agency: expect.objectContaining({ name: 'CAPES' }),
      allocation: expect.objectContaining({ name: 'REMOTO' })
    })
  })

  it('quando o orientador não foi carregado, devolve null', () => {
    const withFullRelations = EnrollmentMapper.detailedWithFullRelations(
      buildEnrollment({ advisor: undefined, scholarships: [] })
    )

    expect(withFullRelations.advisor).toBeNull()
  })
})
