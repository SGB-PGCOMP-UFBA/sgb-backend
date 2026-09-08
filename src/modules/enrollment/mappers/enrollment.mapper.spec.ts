import { describe, expect, it } from 'vitest'
import { ProgramEnum } from '../../../core/enums/ProgramEnum'
import {
  makeAgency,
  makeAllocation,
  makeEnrollment,
  makeScholarship
} from '../../../core/testing/factories'
import { EnrollmentMapper } from './enrollment.mapper'

describe('EnrollmentMapper.forFilter', () => {
  it.each([
    ['MESTRADO', ProgramEnum.MESTRADO],
    ['DOUTORADO', ProgramEnum.DOUTORADO]
  ])(
    'quando monta a opção de filtro, traduz o programa para o rótulo exibido (%s)',
    (program, label) => {
      const option = EnrollmentMapper.forFilter(
        makeEnrollment({ enrollment_program: program })
      )

      expect(option).toEqual({ key: program, value: label })
    }
  )
})

describe('EnrollmentMapper.simplified', () => {
  it('quando mapeia a matrícula, expõe apenas identificadores e timestamps', () => {
    const simplified = EnrollmentMapper.simplified(makeEnrollment())

    expect(Object.keys(simplified).sort()).toEqual([
      'advisor_id',
      'created_at',
      'id',
      'student_id',
      'updated_at'
    ])
  })

  it('quando mapeia a matrícula, omite número, programa e datas acadêmicas', () => {
    const simplified = EnrollmentMapper.simplified(makeEnrollment()) as Record<
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
    const enrollment = makeEnrollment()

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
        makeEnrollment({ enrollment_date: valor as Date })
      )

      expect(detailed.enrollment_date).toBe(valor)
    }
  )

  it('quando a previsão de defesa não foi informada, mantém o valor nulo', () => {
    const detailed = EnrollmentMapper.detailed(
      makeEnrollment({ defense_prediction_date: null })
    )

    expect(detailed.defense_prediction_date).toBeNull()
  })
})

describe('EnrollmentMapper.detailedWithRelations', () => {
  it('quando orientador e aluno não foram carregados, devolve null para os dois', () => {
    const withRelations = EnrollmentMapper.detailedWithRelations(
      makeEnrollment({ advisor: undefined, student: undefined })
    )

    expect(withRelations.advisor).toBeNull()
    expect(withRelations.student).toBeNull()
  })

  it('quando as relações vieram carregadas, mapeia orientador e aluno', () => {
    const withRelations = EnrollmentMapper.detailedWithRelations(
      makeEnrollment()
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
      makeEnrollment({
        scholarships: [
          makeScholarship({ id: 100, status: 'ON_GOING' }),
          makeScholarship({ id: 101, status: 'FINISHED' })
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
      makeEnrollment({ scholarships: undefined })
    )

    expect(withRelations.scholarships).toBeUndefined()
  })
})

describe('EnrollmentMapper.detailedWithFullRelations', () => {
  it('quando as bolsas trazem agência e alocação, aninha as duas no resultado', () => {
    const withFullRelations = EnrollmentMapper.detailedWithFullRelations(
      makeEnrollment({
        scholarships: [
          makeScholarship({
            agency: makeAgency(),
            allocation: makeAllocation()
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
      makeEnrollment({ advisor: undefined, scholarships: [] })
    )

    expect(withFullRelations.advisor).toBeNull()
  })
})
