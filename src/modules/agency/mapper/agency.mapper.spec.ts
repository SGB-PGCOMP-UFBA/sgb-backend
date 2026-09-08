import { describe, expect, it } from 'vitest'
import {
  makeAgency,
  makeScholarship,
  makeScholarshipsForProgram
} from '../../../core/testing/factories'
import { AgencyMapper } from './agency.mapper'

describe('AgencyMapper.detailed', () => {
  it('quando a agência tem bolsas vigentes de mestrado e de doutorado, expõe as concedidas da agência e conta as alocadas das bolsas', () => {
    const agency = makeAgency({
      scholarships: [
        ...makeScholarshipsForProgram(2, 'MESTRADO'),
        ...makeScholarshipsForProgram(1, 'DOUTORADO')
      ]
    })

    const detailed = AgencyMapper.detailed(agency)

    expect(detailed.masters_degree_awarded_scholarships).toBe(13)
    expect(detailed.masters_degree_allocated_scholarships).toBe(2)
    expect(detailed.doctorate_degree_awarded_scholarships).toBe(7)
    expect(detailed.doctorate_degree_allocated_scholarships).toBe(1)
  })

  it('quando a bolsa já foi finalizada, não a conta como vaga alocada', () => {
    const agency = makeAgency({
      scholarships: [makeScholarship(), makeScholarship({ status: 'FINISHED' })]
    })

    expect(
      AgencyMapper.detailed(agency).masters_degree_allocated_scholarships
    ).toBe(1)
  })

  it('quando as alocadas ultrapassam as concedidas, relata o número real sem limitar à cota', () => {
    const agency = makeAgency({
      scholarships: makeScholarshipsForProgram(14, 'MESTRADO')
    })

    const detailed = AgencyMapper.detailed(agency)

    expect(detailed.masters_degree_awarded_scholarships).toBe(13)
    expect(detailed.masters_degree_allocated_scholarships).toBe(14)
  })

  it('quando a agência tem registros finalizados e vigentes, mantém scholarshipsSinceBeginning como o total histórico de registros', () => {
    const agency = makeAgency({
      scholarships: [
        makeScholarship(),
        makeScholarship({ status: 'FINISHED' }),
        makeScholarship({ status: 'FINISHED', enrollment_id: 2 })
      ]
    })

    expect(AgencyMapper.detailed(agency).scholarshipsSinceBeginning).toBe(3)
  })

  it('quando a agência não tem bolsa nenhuma, devolve zero alocadas', () => {
    const detailed = AgencyMapper.detailed(makeAgency())

    expect(detailed.masters_degree_allocated_scholarships).toBe(0)
    expect(detailed.doctorate_degree_allocated_scholarships).toBe(0)
  })
})
