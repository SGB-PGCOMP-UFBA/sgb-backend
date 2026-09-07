import { describe, expect, it } from 'vitest'
import { Scholarship } from '../entities/scholarship.entity'
import {
  countAllocatedScholarshipsByProgram,
  getAwardedSlotsByProgram,
  hasAvailableSlot,
  isActiveScholarship
} from './scholarship-allocation.util'

function buildScholarship(
  enrollmentId: number,
  status: string,
  program: string
): Scholarship {
  return {
    enrollment_id: enrollmentId,
    status,
    enrollment: { id: enrollmentId, enrollment_program: program }
  } as Scholarship
}

describe('isActiveScholarship', () => {
  it('quando o status é ON_GOING ou EXTENDED, considera a bolsa vigente', () => {
    expect(
      isActiveScholarship(buildScholarship(1, 'ON_GOING', 'MESTRADO'))
    ).toBe(true)
    expect(
      isActiveScholarship(buildScholarship(1, 'EXTENDED', 'MESTRADO'))
    ).toBe(true)
  })

  it('quando o status é FINISHED, não considera a bolsa vigente', () => {
    expect(
      isActiveScholarship(buildScholarship(1, 'FINISHED', 'MESTRADO'))
    ).toBe(false)
  })
})

describe('countAllocatedScholarshipsByProgram', () => {
  it('quando a lista tem bolsa finalizada, conta apenas as vigentes', () => {
    const scholarships = [
      buildScholarship(1, 'ON_GOING', 'MESTRADO'),
      buildScholarship(2, 'ON_GOING', 'MESTRADO'),
      buildScholarship(3, 'FINISHED', 'MESTRADO')
    ]

    expect(countAllocatedScholarshipsByProgram(scholarships, 'MESTRADO')).toBe(
      2
    )
  })

  it('quando a lista mistura os dois programas, conta apenas as bolsas do programa pedido', () => {
    const scholarships = [
      buildScholarship(1, 'ON_GOING', 'MESTRADO'),
      buildScholarship(2, 'ON_GOING', 'DOUTORADO'),
      buildScholarship(3, 'ON_GOING', 'DOUTORADO')
    ]

    expect(countAllocatedScholarshipsByProgram(scholarships, 'MESTRADO')).toBe(
      1
    )
    expect(countAllocatedScholarshipsByProgram(scholarships, 'DOUTORADO')).toBe(
      2
    )
  })

  it('quando a lista de bolsas é vazia ou indefinida, conta zero', () => {
    expect(countAllocatedScholarshipsByProgram([], 'MESTRADO')).toBe(0)
    expect(countAllocatedScholarshipsByProgram(undefined, 'MESTRADO')).toBe(0)
  })
})

describe('getAwardedSlotsByProgram', () => {
  const target = {
    masters_degree_awarded_scholarships: 13,
    doctorate_degree_awarded_scholarships: 7
  }

  it('quando o programa tem cota cadastrada, devolve as vagas concedidas do programa', () => {
    expect(getAwardedSlotsByProgram(target, 'MESTRADO')).toBe(13)
    expect(getAwardedSlotsByProgram(target, 'DOUTORADO')).toBe(7)
  })

  it('quando o programa é desconhecido ou o alvo não tem cota, devolve zero', () => {
    expect(getAwardedSlotsByProgram(target, 'GRADUACAO')).toBe(0)
    expect(getAwardedSlotsByProgram({}, 'MESTRADO')).toBe(0)
  })
})

describe('hasAvailableSlot', () => {
  it('quando as alocadas ainda são menos que as concedidas, libera a vaga', () => {
    expect(hasAvailableSlot({ awardedSlots: 13, allocatedSlots: 3 })).toBe(true)
  })

  it('quando as alocadas igualam as concedidas, bloqueia a vaga', () => {
    expect(hasAvailableSlot({ awardedSlots: 2, allocatedSlots: 2 })).toBe(false)
  })

  // O caso exato do print da issue: 14 alocadas para 13 concedidas.
  it('quando as alocadas já ultrapassaram as concedidas, bloqueia a vaga', () => {
    expect(hasAvailableSlot({ awardedSlots: 13, allocatedSlots: 14 })).toBe(
      false
    )
  })

  it('quando não há cota cadastrada, bloqueia a vaga', () => {
    expect(hasAvailableSlot({ awardedSlots: 0, allocatedSlots: 0 })).toBe(false)
  })
})
