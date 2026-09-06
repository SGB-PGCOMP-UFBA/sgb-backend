import { describe, expect, it } from 'vitest'
import { Allocation } from '../entities/allocation.entity'
import { AllocationMapper } from './allocation.mapper'

function buildScholarship(
  enrollmentId: number,
  status: string,
  program: string
) {
  return {
    id: enrollmentId * 10,
    enrollment_id: enrollmentId,
    status,
    salary: 2100,
    enrollment: { id: enrollmentId, enrollment_program: program }
  }
}

function buildAllocation(
  scholarships: unknown[],
  overrides: Record<string, unknown> = {}
): Allocation {
  return {
    id: 1,
    name: 'REMOTO',
    masters_degree_awarded_scholarships: 10,
    doctorate_degree_awarded_scholarships: 5,
    created_at: new Date('2025-05-25'),
    updated_at: new Date('2025-05-25'),
    scholarships,
    ...overrides
  } as Allocation
}

describe('AllocationMapper.forFilter', () => {
  it('quando a alocação vira item de filtro, usa o nome como chave e como rótulo', () => {
    expect(AllocationMapper.forFilter(buildAllocation([]))).toEqual({
      id: 1,
      key: 'REMOTO',
      value: 'REMOTO'
    })
  })
})

describe('AllocationMapper.simplified', () => {
  it('quando a alocação é simplificada, não expõe as cotas de bolsas concedidas', () => {
    const simplified = AllocationMapper.simplified(buildAllocation([]))

    expect(Object.keys(simplified).sort()).toEqual([
      'created_at',
      'id',
      'name',
      'updated_at'
    ])
  })
})

describe('AllocationMapper.detailed', () => {
  it('quando a alocação tem bolsas vigentes de mestrado e de doutorado, expõe as concedidas da alocação e conta as alocadas das bolsas', () => {
    const detailed = AllocationMapper.detailed(
      buildAllocation([
        buildScholarship(1, 'ON_GOING', 'MESTRADO'),
        buildScholarship(2, 'ON_GOING', 'MESTRADO'),
        buildScholarship(3, 'ON_GOING', 'DOUTORADO')
      ])
    )

    expect(detailed.masters_degree_awarded_scholarships).toBe(10)
    expect(detailed.masters_degree_allocated_scholarships).toBe(2)
    expect(detailed.doctorate_degree_awarded_scholarships).toBe(5)
    expect(detailed.doctorate_degree_allocated_scholarships).toBe(1)
  })

  it('quando a alocação tem bolsa finalizada junto das vigentes, conta uma vaga por bolsa vigente', () => {
    const detailed = AllocationMapper.detailed(
      buildAllocation([
        buildScholarship(1, 'ON_GOING', 'MESTRADO'),
        buildScholarship(2, 'ON_GOING', 'MESTRADO'),
        buildScholarship(3, 'FINISHED', 'MESTRADO')
      ])
    )

    expect(detailed.masters_degree_allocated_scholarships).toBe(2)
  })

  it('quando a cota cadastrada é igual ao número de bolsas vigentes, mantém as alocadas dentro das concedidas', () => {
    const detailed = AllocationMapper.detailed(
      buildAllocation(
        [
          buildScholarship(1, 'ON_GOING', 'MESTRADO'),
          buildScholarship(2, 'ON_GOING', 'MESTRADO')
        ],
        { masters_degree_awarded_scholarships: 2 }
      )
    )

    expect(detailed.masters_degree_allocated_scholarships).toBeLessThanOrEqual(
      detailed.masters_degree_awarded_scholarships
    )
  })

  it.each([['FINISHED'], ['INACTIVE']])(
    'quando a bolsa está num status que libera a alocação, não a conta como vaga ocupada (%s)',
    (status) => {
      const detailed = AllocationMapper.detailed(
        buildAllocation([
          buildScholarship(1, 'ON_GOING', 'MESTRADO'),
          buildScholarship(2, status, 'MESTRADO')
        ])
      )

      expect(detailed.masters_degree_allocated_scholarships).toBe(1)
    }
  )

  it('quando a alocação tem bolsas dos dois programas, separa a contagem de mestrado da de doutorado', () => {
    const detailed = AllocationMapper.detailed(
      buildAllocation([
        buildScholarship(1, 'ON_GOING', 'MESTRADO'),
        buildScholarship(2, 'ON_GOING', 'DOUTORADO'),
        buildScholarship(3, 'ON_GOING', 'DOUTORADO')
      ])
    )

    expect(detailed.masters_degree_allocated_scholarships).toBe(1)
    expect(detailed.doctorate_degree_allocated_scholarships).toBe(2)
  })

  it('quando a alocação tem registros finalizados e vigentes, conta todos eles em scholarshipsSinceBeginning', () => {
    const detailed = AllocationMapper.detailed(
      buildAllocation([
        buildScholarship(1, 'ON_GOING', 'MESTRADO'),
        buildScholarship(1, 'FINISHED', 'MESTRADO'),
        buildScholarship(2, 'FINISHED', 'DOUTORADO')
      ])
    )

    expect(detailed.scholarshipsSinceBeginning).toBe(3)
    expect(detailed.masters_degree_allocated_scholarships).toBe(1)
  })

  it('quando a alocação não tem bolsa nenhuma, devolve zero em todas as contagens', () => {
    const detailed = AllocationMapper.detailed(buildAllocation([]))

    expect(detailed.scholarshipsSinceBeginning).toBe(0)
    expect(detailed.masters_degree_allocated_scholarships).toBe(0)
    expect(detailed.doctorate_degree_allocated_scholarships).toBe(0)
  })
})

describe('AllocationMapper.detailedWithRelations', () => {
  it('quando a alocação é detalhada com relações, mantém as contagens e ainda lista as bolsas', () => {
    const withRelations = AllocationMapper.detailedWithRelations(
      buildAllocation([
        buildScholarship(1, 'ON_GOING', 'MESTRADO'),
        buildScholarship(2, 'FINISHED', 'MESTRADO')
      ])
    )

    expect(withRelations.masters_degree_allocated_scholarships).toBe(1)
    expect(withRelations.scholarships).toHaveLength(2)
    expect(withRelations.scholarships[0]).toMatchObject({
      enrollment_id: 1,
      status: 'ON_GOING'
    })
  })
})
