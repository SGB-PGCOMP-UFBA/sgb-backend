import { toCalendarDay } from '@/common/utils/calendar-day.util'
import { Agency } from '@/agency/entities/agency.entity'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { User } from '@/user/entities/user.entity'

type Overrides<T> = Partial<T> & Record<string, unknown>

export interface Factory<T> {
  (overrides?: Overrides<T>): T
  list(total: number, overridesAt?: (index: number) => Overrides<T>): T[]
}

function defineFactory<T>(defaults: () => T): Factory<T> {
  const factory = ((overrides: Overrides<T> = {}) =>
    ({ ...defaults(), ...overrides } as T)) as Factory<T>

  factory.list = (total, overridesAt = () => ({} as Overrides<T>)) =>
    Array.from({ length: total }, (_, index) => factory(overridesAt(index)))

  return factory
}

const CRIADO_EM = new Date('2024-01-01T00:00:00.000Z')

const userDefaults = (): User => ({
  id: 1,
  name: 'Usuário Teste',
  email: 'usuario@ufba.br',
  tax_id: null,
  phone_number: null,
  password: '$2a$10$hash',
  role: 'STUDENT',
  status: null,
  link_to_lattes: null,
  has_admin_privileges: false,
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  enrollments: [],
  advised_enrollments: []
})

export const makeStudent = defineFactory<User>(() => ({
  ...userDefaults(),
  id: 7,
  name: 'Aluno Teste',
  email: 'aluno@ufba.br',
  tax_id: '12345678901',
  phone_number: '71999999999',
  link_to_lattes: 'http://lattes.cnpq.br/1',
  role: 'STUDENT'
}))

export const makeAdvisor = defineFactory<User>(() => ({
  ...userDefaults(),
  id: 10,
  name: 'Orientadora Teste',
  email: 'orientadora@ufba.br',
  tax_id: '98765432100',
  phone_number: '71988888888',
  role: 'ADVISOR',
  status: 'ACTIVE'
}))

export const makeAdmin = defineFactory<User>(() => ({
  ...userDefaults(),
  id: 3,
  name: 'Carlos Lima',
  email: 'carlos@ufba.br',
  tax_id: '12345678901',
  phone_number: '71999999999',
  role: 'ADMIN',
  status: 'ACTIVE'
}))

export const makeEnrollment = defineFactory<Enrollment>(() => ({
  id: 42,
  student_id: 7,
  advisor_id: 10,
  enrollment_number: '2024123456',
  enrollment_program: 'MESTRADO',
  enrollment_date: '2024-03-01',
  defense_prediction_date: '2026-02-28',
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  scholarships: [],
  student: makeStudent(),
  advisor: makeAdvisor()
}))

export const makeAgency = defineFactory<Agency>(() => ({
  id: 1,
  name: 'CAPES',
  description: 'Coordenação de Aperfeiçoamento de Pessoal de Nível Superior',
  masters_degree_awarded_scholarships: 13,
  doctorate_degree_awarded_scholarships: 7,
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  scholarships: []
}))

export const makeAllocation = defineFactory<Allocation>(() => ({
  id: 2,
  name: 'REMOTO',
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  scholarships: []
}))

export function daysFromToday(days: number): Date {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)

  return date
}

/** Dia de calendário (`yyyy-MM-dd`) a tantos dias de hoje, como o banco devolve. */
export function dayFromToday(days: number): string {
  return toCalendarDay(daysFromToday(days))
}

export const notStartedScholarship = () => ({
  scholarship_starts_at: dayFromToday(30),
  scholarship_ends_at: dayFromToday(395),
  extension_ends_at: null as string | null
})

export const activeScholarship = () => ({
  scholarship_starts_at: dayFromToday(-365),
  scholarship_ends_at: dayFromToday(365),
  extension_ends_at: null as string | null
})

export const extendedScholarship = () => ({
  scholarship_starts_at: dayFromToday(-730),
  scholarship_ends_at: dayFromToday(-1),
  extension_ends_at: dayFromToday(180)
})

export const finishedScholarship = () => ({
  scholarship_starts_at: dayFromToday(-730),
  scholarship_ends_at: dayFromToday(-1),
  extension_ends_at: null as string | null
})

export const makeScholarship = defineFactory<Scholarship>(() => ({
  id: 100,
  enrollment_id: 42,
  agency_id: 1,
  allocation_id: 2,
  ...activeScholarship(),
  salary: 2100,
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  enrollment: makeEnrollment(),
  agency: makeAgency(),
  allocation: makeAllocation()
}))

export function makeScholarshipsForProgram(
  total: number,
  program: string,
  overridesAt: (index: number) => Overrides<Scholarship> = () => ({})
): Scholarship[] {
  return makeScholarship.list(total, (index) => ({
    id: 100 + index,
    enrollment_id: index + 1,
    enrollment: makeEnrollment({
      id: index + 1,
      enrollment_program: program
    }),
    ...overridesAt(index)
  }))
}

export const makeEmbedNotification = defineFactory<EmbedNotification>(() => ({
  id: 55,
  owner_id: 7,
  owner_type: 'STUDENT',
  title: 'Sua bolsa CAPES expirou!',
  description: 'Procure seu orientador para mais informações.',
  consumed: false,
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM
}))
