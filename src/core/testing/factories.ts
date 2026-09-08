import { Admin } from '@/modules/admin/entities/admin.entity'
import { Advisor } from '@/modules/advisor/entities/advisor.entity'
import { Agency } from '@/modules/agency/entities/agency.entity'
import { Allocation } from '@/modules/allocation/entities/allocation.entity'
import { EmbedNotification } from '@/modules/embed-notification/entity/embed-notification.entity'
import { Enrollment } from '@/modules/enrollment/entities/enrollment.entity'
import { PendingScholarship } from '@/modules/pending-scholarship/entities/pending-scholarship.entity'
import { Scholarship } from '@/modules/scholarship/entities/scholarship.entity'
import { Student } from '@/modules/student/entities/student.entity'

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

export const makeStudent = defineFactory<Student>(() => ({
  id: 7,
  name: 'Aluno Teste',
  email: 'aluno@ufba.br',
  tax_id: '12345678901',
  phone_number: '71999999999',
  link_to_lattes: 'http://lattes.cnpq.br/1',
  password: '$2a$10$hash',
  role: 'STUDENT',
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  enrollments: []
}))

export const makeAdvisor = defineFactory<Advisor>(() => ({
  id: 10,
  name: 'Orientadora Teste',
  email: 'orientadora@ufba.br',
  tax_id: '98765432100',
  phone_number: '71988888888',
  password: '$2a$10$hash',
  role: 'ADVISOR',
  status: 'ACTIVE',
  has_admin_privileges: false,
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  enrollments: []
}))

export const makeAdmin = defineFactory<Admin>(() => ({
  id: 3,
  name: 'Carlos Lima',
  email: 'carlos@ufba.br',
  tax_id: '12345678901',
  phone_number: '71999999999',
  password: '$2a$10$hash',
  role: 'ADMIN',
  status: 'ACTIVE',
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM
}))

export const makeEnrollment = defineFactory<Enrollment>(() => ({
  id: 42,
  student_id: 7,
  advisor_id: 10,
  enrollment_number: '2024123456',
  enrollment_program: 'MESTRADO',
  enrollment_date: new Date('2024-03-01T00:00:00.000Z'),
  defense_prediction_date: new Date('2026-02-28T00:00:00.000Z'),
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
  masters_degree_awarded_scholarships: 10,
  doctorate_degree_awarded_scholarships: 5,
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM,
  scholarships: []
}))

export const makeScholarship = defineFactory<Scholarship>(() => ({
  id: 100,
  enrollment_id: 42,
  agency_id: 1,
  allocation_id: 2,
  status: 'ON_GOING',
  scholarship_starts_at: new Date('2024-03-01T00:00:00.000Z'),
  scholarship_ends_at: new Date('2026-02-28T00:00:00.000Z'),
  extension_ends_at: null,
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

export const makePendingScholarship = defineFactory<PendingScholarship>(() => ({
  id: 8,
  student_name: 'Aluno Teste',
  tax_id: '12345678901',
  enrollment_program: 'MESTRADO',
  agency: 'CAPES',
  scholarship_starts_at: new Date('2026-01-01T00:00:00.000Z'),
  scholarship_ends_at: new Date('2026-12-01T00:00:00.000Z'),
  created_at: CRIADO_EM,
  updated_at: CRIADO_EM
}))
