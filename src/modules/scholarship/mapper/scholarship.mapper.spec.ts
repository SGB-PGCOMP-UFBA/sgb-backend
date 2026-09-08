import { describe, expect, it } from 'vitest'
import { StatusEnum } from '../../../core/enums/StatusEnum'
import {
  makeAgency,
  makeAllocation,
  makeScholarship
} from '../../../core/testing/factories'
import { ScholarshipMapper } from './scholarship.mapper'

/** Linha crua do relatório entre datas, como o `getRawMany` devolve. */
function reportRow(
  agencyName: string,
  status: string,
  mastersCount: unknown,
  phdCount: unknown
) {
  return {
    agency_name: agencyName,
    status,
    masters_count: mastersCount,
    phd_count: phdCount
  }
}

function findAgency(report: unknown[], agencyName: string) {
  return report.find((item: any) => item.agencyName === agencyName) as Record<
    string,
    any
  >
}

describe('ScholarshipMapper.forFilter', () => {
  it.each([
    ['ON_GOING', StatusEnum.ON_GOING],
    ['EXTENDED', StatusEnum.EXTENDED],
    ['FINISHED', StatusEnum.FINISHED],
    ['INACTIVE', StatusEnum.INACTIVE],
    ['ALL', StatusEnum.ALL]
  ])(
    'quando a bolsa tem um status conhecido, traduz o status para o rótulo exibido (%s)',
    (status, label) => {
      expect(ScholarshipMapper.forFilter(makeScholarship({ status }))).toEqual({
        key: status,
        value: label
      })
    }
  )

  it('quando a bolsa está prorrogada, distingue o rótulo do de em andamento', () => {
    const onGoing = ScholarshipMapper.forFilter(
      makeScholarship({ status: 'ON_GOING' })
    )
    const extended = ScholarshipMapper.forFilter(
      makeScholarship({ status: 'EXTENDED' })
    )

    expect(extended.value).not.toBe(onGoing.value)
    expect(extended.value).toContain(onGoing.value)
  })
})

describe('ScholarshipMapper.simplified', () => {
  it('quando a bolsa é simplificada, expõe só os vínculos e o status, sem valores nem vigência', () => {
    const simplified = ScholarshipMapper.simplified(makeScholarship())

    expect(Object.keys(simplified).sort()).toEqual([
      'agency_id',
      'allocation_id',
      'created_at',
      'enrollment_id',
      'id',
      'status',
      'updated_at'
    ])
  })

  it('quando a bolsa é simplificada, não expõe o salário', () => {
    const simplified = ScholarshipMapper.simplified(
      makeScholarship()
    ) as Record<string, unknown>

    expect(simplified.salary).toBeUndefined()
  })
})

describe('ScholarshipMapper.detailed', () => {
  it('quando a bolsa é detalhada, acrescenta vigência e salário sem perder os campos do simplified', () => {
    const scholarship = makeScholarship({
      extension_ends_at: new Date('2026-08-31')
    })

    expect(ScholarshipMapper.detailed(scholarship)).toEqual({
      id: 100,
      agency_id: 1,
      allocation_id: 2,
      enrollment_id: 42,
      status: 'ON_GOING',
      created_at: scholarship.created_at,
      updated_at: scholarship.updated_at,
      scholarship_starts_at: scholarship.scholarship_starts_at,
      scholarship_ends_at: scholarship.scholarship_ends_at,
      extension_ends_at: scholarship.extension_ends_at,
      salary: 2100
    })
  })

  it.each([
    ['string vinda do driver', '2024-03-01'],
    ['objeto Date', new Date('2024-03-01T00:00:00.000Z')]
  ])(
    'quando a data de início chega crua do banco, repassa o valor sem converter (%s)',
    (_caso, valor) => {
      const detailed = ScholarshipMapper.detailed(
        makeScholarship({ scholarship_starts_at: valor as Date })
      )

      expect(detailed.scholarship_starts_at).toBe(valor)
    }
  )

  it('quando a bolsa não foi prorrogada, mantém nula a data de prorrogação', () => {
    expect(
      ScholarshipMapper.detailed(makeScholarship()).extension_ends_at
    ).toBeNull()
  })
})

describe('ScholarshipMapper.detailedWithRelations', () => {
  it('quando a matrícula vem carregada, achata aluno e orientador a partir dela', () => {
    const withRelations = ScholarshipMapper.detailedWithRelations(
      makeScholarship({ agency: makeAgency(), allocation: makeAllocation() })
    )

    expect(withRelations.enrollment).toMatchObject({
      id: 42,
      enrollment_number: '2024123456'
    })
    expect(withRelations.student).toMatchObject({ email: 'aluno@ufba.br' })
    expect(withRelations.advisor).toMatchObject({
      email: 'orientadora@ufba.br'
    })
  })

  it('quando a agência e a alocação vêm carregadas, embute as duas sem as cotas de vagas', () => {
    const agency = makeAgency({ description: 'Agência federal' })
    const allocation = makeAllocation()

    const withRelations = ScholarshipMapper.detailedWithRelations(
      makeScholarship({ agency, allocation })
    )

    expect(withRelations.agency).toEqual({
      id: 1,
      name: 'CAPES',
      description: 'Agência federal',
      created_at: agency.created_at,
      updated_at: agency.updated_at
    })
    expect(withRelations.allocation).toEqual({
      id: 2,
      name: 'REMOTO',
      created_at: allocation.created_at,
      updated_at: allocation.updated_at
    })
  })

  it('quando nenhuma relação veio carregada, devolve null para cada uma delas', () => {
    const withRelations = ScholarshipMapper.detailedWithRelations(
      makeScholarship({
        agency: undefined,
        allocation: undefined,
        enrollment: undefined
      })
    )

    expect(withRelations.agency).toBeNull()
    expect(withRelations.allocation).toBeNull()
    expect(withRelations.enrollment).toBeNull()
    expect(withRelations.student).toBeNull()
    expect(withRelations.advisor).toBeNull()
  })

  it('quando a bolsa não tem alocação vinculada, ainda a lista com a agência preenchida', () => {
    const withRelations = ScholarshipMapper.detailedWithRelations(
      makeScholarship({
        allocation_id: null,
        allocation: null,
        agency: makeAgency()
      })
    )

    expect(withRelations.allocation).toBeNull()
    expect(withRelations.agency).not.toBeNull()
  })
})

describe('ScholarshipMapper.detailedWithFullRelations', () => {
  it('quando a bolsa é detalhada dentro da matrícula, não repete matrícula, aluno nem orientador', () => {
    const withFullRelations = ScholarshipMapper.detailedWithFullRelations(
      makeScholarship({ agency: makeAgency(), allocation: makeAllocation() })
    )

    expect(Object.keys(withFullRelations).sort()).toEqual([
      'agency',
      'allocation',
      'created_at',
      'extension_ends_at',
      'id',
      'salary',
      'scholarship_ends_at',
      'scholarship_starts_at',
      'status',
      'updated_at'
    ])
  })

  it('quando agência e alocação não vieram carregadas, devolve null para as duas', () => {
    const withFullRelations = ScholarshipMapper.detailedWithFullRelations(
      makeScholarship({ agency: undefined, allocation: undefined })
    )

    expect(withFullRelations.agency).toBeNull()
    expect(withFullRelations.allocation).toBeNull()
  })
})

describe('ScholarshipMapper.countOnGoingScholarshipsGroupingByAgencyForCourse', () => {
  it('quando há contagens de vários cursos e agências, indexa por curso e depois por agência', () => {
    const result =
      ScholarshipMapper.countOnGoingScholarshipsGroupingByAgencyForCourse([
        { course_name: 'MESTRADO', agency_name: 'CAPES', count: 5 },
        { course_name: 'MESTRADO', agency_name: 'CNPQ', count: 2 },
        { course_name: 'DOUTORADO', agency_name: 'CAPES', count: 3 }
      ])

    expect(result).toEqual({
      MESTRADO: { CAPES: { count: 5 }, CNPQ: { count: 2 } },
      DOUTORADO: { CAPES: { count: 3 } }
    })
  })

  it('quando não há bolsa vigente, devolve objeto vazio', () => {
    expect(
      ScholarshipMapper.countOnGoingScholarshipsGroupingByAgencyForCourse([])
    ).toEqual({})
  })

  it('quando a mesma agência aparece em dois cursos, não mistura as contagens', () => {
    const result =
      ScholarshipMapper.countOnGoingScholarshipsGroupingByAgencyForCourse([
        { course_name: 'MESTRADO', agency_name: 'CAPES', count: 5 },
        { course_name: 'DOUTORADO', agency_name: 'CAPES', count: 3 }
      ])

    expect(result['MESTRADO']['CAPES'].count).toBe(5)
    expect(result['DOUTORADO']['CAPES'].count).toBe(3)
  })
})

describe('ScholarshipMapper.countScholarshipsGroupingByStatusForAgency', () => {
  it('quando há contagens de vários status, agrupa por status debaixo do nome da agência', () => {
    const result = ScholarshipMapper.countScholarshipsGroupingByStatusForAgency(
      [
        { status: 'ON_GOING', count: 8 },
        { status: 'EXTENDED', count: 2 },
        { status: 'FINISHED', count: 21 }
      ],
      'CAPES'
    )

    expect(result).toEqual({
      CAPES: {
        ON_GOING: { count: 8 },
        EXTENDED: { count: 2 },
        FINISHED: { count: 21 }
      }
    })
  })

  it('quando a agência tem bolsas em andamento e prorrogadas, mantém os dois status separados', () => {
    const result = ScholarshipMapper.countScholarshipsGroupingByStatusForAgency(
      [
        { status: 'ON_GOING', count: 8 },
        { status: 'EXTENDED', count: 2 }
      ],
      'CNPQ'
    )

    expect(Object.keys(result['CNPQ'])).toEqual(['ON_GOING', 'EXTENDED'])
  })
})

describe('ScholarshipMapper.countScholarshipsGroupingByCourseAndYear', () => {
  it('quando há bolsas em vários anos, indexa mestrado e doutorado por ano de início da bolsa', () => {
    const result = ScholarshipMapper.countScholarshipsGroupingByCourseAndYear([
      { year: '2023', masters_count: 4, phd_count: 2 },
      { year: '2024', masters_count: 6, phd_count: 3 }
    ])

    expect(result).toEqual({
      2023: { MESTRADO: 4, DOUTORADO: 2 },
      2024: { MESTRADO: 6, DOUTORADO: 3 }
    })
  })

  it.each([
    ['null', null],
    ['undefined', undefined]
  ])(
    'quando a soma de um dos programas vem vazia, zera o programa sem bolsa (%s)',
    (_caso, vazio) => {
      const result = ScholarshipMapper.countScholarshipsGroupingByCourseAndYear(
        [{ year: '2024', masters_count: 6, phd_count: vazio }]
      )

      expect(result['2024']).toEqual({ MESTRADO: 6, DOUTORADO: 0 })
    }
  )

  it('quando não há bolsa em nenhum ano, devolve objeto vazio', () => {
    expect(
      ScholarshipMapper.countScholarshipsGroupingByCourseAndYear([])
    ).toEqual({})
  })
})

describe('ScholarshipMapper.countAllScholarshipsGroupingBetweenDates', () => {
  it('quando não há dados no período, devolve as três agências obrigatórias zeradas', () => {
    const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates(
      []
    )

    expect(report.map((item: any) => item.agencyName)).toEqual([
      'CNPQ',
      'CAPES',
      'FAPESB'
    ])
    expect(report[0]).toEqual({
      agencyName: 'CNPQ',
      scholarshipsTotal: 0,
      totalMasters: 0,
      totalPhd: 0,
      activeCount: { masters: 0, phd: 0 },
      inactiveCount: { masters: 0, phd: 0 },
      finishedCount: { masters: 0, phd: 0 },
      onGoingCount: { masters: 0, phd: 0 },
      extendedCount: { masters: 0, phd: 0 }
    })
  })

  it('quando aparece uma agência fora da lista obrigatória, mantém a ordem CNPQ, CAPES, FAPESB e joga as demais no fim', () => {
    const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([
      reportRow('FAPESB', 'ON_GOING', 1, 0),
      reportRow('FUNDAÇÃO X', 'ON_GOING', 1, 0),
      reportRow('CNPQ', 'ON_GOING', 1, 0)
    ])

    expect(report.map((item: any) => item.agencyName)).toEqual([
      'CNPQ',
      'CAPES',
      'FAPESB',
      'FUNDAÇÃO X'
    ])
  })

  it('quando a agência não está na lista obrigatória, cria a agência com os demais baldes zerados', () => {
    const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([
      reportRow('FUNDAÇÃO X', 'FINISHED', 2, 1)
    ])
    const fundacao = findAgency(report, 'FUNDAÇÃO X')

    expect(fundacao.finishedCount).toEqual({ masters: 2, phd: 1 })
    expect(fundacao.onGoingCount).toEqual({ masters: 0, phd: 0 })
    expect(fundacao.scholarshipsTotal).toBe(3)
  })

  it.each([
    ['ACTIVE', 'activeCount'],
    ['INACTIVE', 'inactiveCount'],
    ['FINISHED', 'finishedCount'],
    ['ON_GOING', 'onGoingCount'],
    ['EXTENDED', 'extendedCount']
  ])(
    'quando a linha do relatório tem um status conhecido, joga as contagens no balde daquele status (%s, %s)',
    (status, bucket) => {
      const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates(
        [reportRow('CAPES', status, 3, 2)]
      )
      const capes = findAgency(report, 'CAPES')

      expect(capes[bucket]).toEqual({ masters: 3, phd: 2 })
      expect(capes.totalMasters).toBe(3)
      expect(capes.totalPhd).toBe(2)
    }
  )

  it('quando as somas chegam como string do driver, converte para número antes de totalizar', () => {
    const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([
      reportRow('CAPES', 'ON_GOING', '3', '2'),
      reportRow('CAPES', 'FINISHED', '1', '4')
    ])
    const capes = findAgency(report, 'CAPES')

    expect(capes.totalMasters).toBe(4)
    expect(capes.totalPhd).toBe(6)
    expect(capes.scholarshipsTotal).toBe(10)
  })

  it('quando a mesma agência tem várias linhas de status, acumula as contagens em cada balde', () => {
    const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([
      reportRow('CNPQ', 'ON_GOING', 2, 1),
      reportRow('CNPQ', 'EXTENDED', 1, 0),
      reportRow('CNPQ', 'FINISHED', 5, 3)
    ])
    const cnpq = findAgency(report, 'CNPQ')

    expect(cnpq.onGoingCount).toEqual({ masters: 2, phd: 1 })
    expect(cnpq.extendedCount).toEqual({ masters: 1, phd: 0 })
    expect(cnpq.finishedCount).toEqual({ masters: 5, phd: 3 })
    expect(cnpq.totalMasters).toBe(8)
    expect(cnpq.totalPhd).toBe(4)
  })

  it('quando a agência tem contagens nos dois programas, mantém o total igual à soma de mestrado com doutorado', () => {
    const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([
      reportRow('CAPES', 'ON_GOING', 7, 5),
      reportRow('CAPES', 'FINISHED', 2, 1)
    ])
    const capes = findAgency(report, 'CAPES')

    expect(capes.scholarshipsTotal).toBe(capes.totalMasters + capes.totalPhd)
    expect(capes.scholarshipsTotal).toBe(15)
  })

  it('quando há linhas de agências diferentes, não deixa uma contaminar os números da outra', () => {
    const report = ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([
      reportRow('CAPES', 'ON_GOING', 3, 0),
      reportRow('CNPQ', 'ON_GOING', 1, 1)
    ])

    expect(findAgency(report, 'CAPES').scholarshipsTotal).toBe(3)
    expect(findAgency(report, 'CNPQ').scholarshipsTotal).toBe(2)
    expect(findAgency(report, 'FAPESB').scholarshipsTotal).toBe(0)
  })

  it('quando o relatório é gerado uma segunda vez, não acumula os dados da chamada anterior', () => {
    ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([
      reportRow('CAPES', 'ON_GOING', 9, 9)
    ])

    const segundoRelatorio =
      ScholarshipMapper.countAllScholarshipsGroupingBetweenDates([])

    expect(findAgency(segundoRelatorio, 'CAPES').scholarshipsTotal).toBe(0)
  })
})

describe('ScholarshipMapper.copyFilteredScholarshipsStudentsEmails', () => {
  it('quando há vários e-mails, junta todos separados por vírgula e espaço', () => {
    expect(
      ScholarshipMapper.copyFilteredScholarshipsStudentsEmails([
        'a@ufba.br',
        'b@ufba.br'
      ])
    ).toBe('a@ufba.br, b@ufba.br')
  })

  it.each([[[], '']])(
    'quando a lista de e-mails está vazia, devolve string vazia (%j)',
    (emails, esperado) => {
      expect(
        ScholarshipMapper.copyFilteredScholarshipsStudentsEmails(
          emails as string[]
        )
      ).toBe(esperado)
    }
  )

  it.each([[['a@ufba.br'], 'a@ufba.br']])(
    'quando a lista tem um único e-mail, devolve o e-mail sem separador (%j)',
    (emails, esperado) => {
      expect(
        ScholarshipMapper.copyFilteredScholarshipsStudentsEmails(
          emails as string[]
        )
      ).toBe(esperado)
    }
  )
})
