import { describe, expect, it } from 'vitest'
import { Agency } from '../entities/agency.entity'
import { AgencyMapper } from './agency.mapper'

function buildAgency(scholarships: unknown[]): Agency {
  return {
    id: 1,
    name: 'CAPES',
    description: 'Coordenação de Aperfeiçoamento de Pessoal de Nível Superior',
    masters_degree_awarded_scholarships: 13,
    doctorate_degree_awarded_scholarships: 7,
    created_at: new Date('2024-08-05'),
    updated_at: new Date('2024-08-05'),
    scholarships
  } as Agency
}

function buildScholarship(
  enrollmentId: number,
  status: string,
  program: string
) {
  return {
    enrollment_id: enrollmentId,
    status,
    enrollment: { id: enrollmentId, enrollment_program: program }
  }
}

describe('AgencyMapper.detailed', () => {
  it('quando a agência tem bolsas vigentes de mestrado e de doutorado, expõe as concedidas da agência e conta as alocadas das bolsas', () => {
    const agency = buildAgency([
      buildScholarship(1, 'ON_GOING', 'MESTRADO'),
      buildScholarship(2, 'ON_GOING', 'MESTRADO'),
      buildScholarship(3, 'ON_GOING', 'DOUTORADO')
    ])

    const detailed = AgencyMapper.detailed(agency)

    expect(detailed.masters_degree_awarded_scholarships).toBe(13)
    expect(detailed.masters_degree_allocated_scholarships).toBe(2)
    expect(detailed.doctorate_degree_awarded_scholarships).toBe(7)
    expect(detailed.doctorate_degree_allocated_scholarships).toBe(1)
  })

  it('quando a bolsa já foi finalizada, não a conta como vaga alocada', () => {
    const agency = buildAgency([
      buildScholarship(1, 'ON_GOING', 'MESTRADO'),
      buildScholarship(2, 'FINISHED', 'MESTRADO')
    ])

    expect(
      AgencyMapper.detailed(agency).masters_degree_allocated_scholarships
    ).toBe(1)
  })

  it('quando as alocadas ultrapassam as concedidas, relata o número real sem limitar à cota', () => {
    const scholarships = Array.from({ length: 14 }, (_, index) =>
      buildScholarship(index + 1, 'ON_GOING', 'MESTRADO')
    )

    const detailed = AgencyMapper.detailed(buildAgency(scholarships))

    expect(detailed.masters_degree_awarded_scholarships).toBe(13)
    expect(detailed.masters_degree_allocated_scholarships).toBe(14)
  })

  it('quando a agência tem registros finalizados e vigentes, mantém scholarshipsSinceBeginning como o total histórico de registros', () => {
    const agency = buildAgency([
      buildScholarship(1, 'ON_GOING', 'MESTRADO'),
      buildScholarship(1, 'FINISHED', 'MESTRADO'),
      buildScholarship(2, 'FINISHED', 'MESTRADO')
    ])

    expect(AgencyMapper.detailed(agency).scholarshipsSinceBeginning).toBe(3)
  })

  it('quando a agência não tem bolsa nenhuma, devolve zero alocadas', () => {
    const detailed = AgencyMapper.detailed(buildAgency([]))

    expect(detailed.masters_degree_allocated_scholarships).toBe(0)
    expect(detailed.doctorate_degree_allocated_scholarships).toBe(0)
  })
})
