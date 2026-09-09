import { Scholarship } from '@/modules/scholarship/entities/scholarship.entity'

export const ACTIVE_SCHOLARSHIP_STATUSES = ['ON_GOING', 'EXTENDED']

export function isActiveScholarship(scholarship: Scholarship): boolean {
  return ACTIVE_SCHOLARSHIP_STATUSES.includes(scholarship?.status)
}

/**
 * Uma bolsa vigente ocupa uma vaga. Prorrogação não cria registro novo: é a
 * própria bolsa mudando de ON_GOING para EXTENDED, então cada matrícula tem no
 * máximo uma bolsa vigente e contar registros é contar vagas ocupadas.
 */
export function countAllocatedScholarshipsByProgram(
  scholarships: Scholarship[] = [],
  program: string
): number {
  return scholarships.filter(
    (scholarship) =>
      isActiveScholarship(scholarship) &&
      scholarship.enrollment?.enrollment_program === program
  ).length
}

/**
 * Quantidade de vagas concedidas para o programa em uma agência ou alocação.
 */
export function getAwardedSlotsByProgram(
  target: {
    masters_degree_awarded_scholarships?: number
    doctorate_degree_awarded_scholarships?: number
  },
  program: string
): number {
  if (program === 'MESTRADO') {
    return target?.masters_degree_awarded_scholarships ?? 0
  }

  if (program === 'DOUTORADO') {
    return target?.doctorate_degree_awarded_scholarships ?? 0
  }

  return 0
}

/**
 * Regra de negócio: a quantidade de vagas alocadas nunca pode ultrapassar a
 * quantidade de vagas concedidas. Menor ou igual é válido, e cota zerada
 * significa nenhuma vaga disponível.
 */
export function hasAvailableSlot(params: {
  awardedSlots: number
  allocatedSlots: number
}): boolean {
  return params.allocatedSlots < params.awardedSlots
}
