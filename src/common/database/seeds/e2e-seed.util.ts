import { DataSource } from 'typeorm'
import { Agency } from '@/agency/entities/agency.entity'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { User } from '@/user/entities/user.entity'
import { hashPassword } from '@/common/utils/bcrypt.util'
import type { CalendarDay } from '@/common/utils/calendar-day.util'
import {
  assertE2eDatabase,
  type E2eEnvironment
} from '@/common/database/seeds/e2e-environment.util'

/**
 * Senha de todos os usuários do seed. Só existe no banco descartável do e2e;
 * o front repete o valor em `e2e/fixtures/users.ts`. Tem 8 caracteres porque o
 * campo de senha do login no front corta em 8 (`maxLength`).
 */
export const E2E_PASSWORD = 'E2e@Sgb1'

type SeedUser = Pick<
  User,
  | 'name'
  | 'email'
  | 'tax_id'
  | 'phone_number'
  | 'role'
  | 'status'
  | 'link_to_lattes'
  | 'has_admin_privileges'
>

export const E2E_USERS = {
  admin: {
    name: 'Admin E2E',
    email: 'admin.e2e@sgb.test',
    tax_id: '52998224725',
    phone_number: '71999990001',
    role: 'ADMIN',
    status: 'ACTIVE',
    link_to_lattes: null,
    has_admin_privileges: false
  },
  advisorAdmin: {
    name: 'Orientadora Admin E2E',
    email: 'orientador.admin.e2e@sgb.test',
    tax_id: null,
    phone_number: '71999990002',
    role: 'ADVISOR',
    status: 'ACTIVE',
    link_to_lattes: null,
    has_admin_privileges: true
  },
  advisor: {
    name: 'Orientador E2E',
    email: 'orientador.e2e@sgb.test',
    tax_id: null,
    phone_number: '71999990003',
    role: 'ADVISOR',
    status: 'ACTIVE',
    link_to_lattes: null,
    has_admin_privileges: false
  },
  otherAdvisor: {
    name: 'Outro Orientador E2E',
    email: 'orientador2.e2e@sgb.test',
    tax_id: null,
    phone_number: '71999990004',
    role: 'ADVISOR',
    status: 'ACTIVE',
    link_to_lattes: null,
    has_admin_privileges: false
  },
  student: {
    name: 'Estudante E2E',
    email: 'estudante.e2e@sgb.test',
    tax_id: '11144477735',
    phone_number: '71999990005',
    role: 'STUDENT',
    status: null,
    link_to_lattes: 'http://lattes.cnpq.br/0000000000000001',
    has_admin_privileges: false
  },
  otherStudent: {
    name: 'Outra Estudante E2E',
    email: 'estudante2.e2e@sgb.test',
    tax_id: '39053344705',
    phone_number: '71999990006',
    role: 'STUDENT',
    status: null,
    link_to_lattes: null,
    has_admin_privileges: false
  },
  finishedStudent: {
    name: 'Estudante Formado E2E',
    email: 'estudante3.e2e@sgb.test',
    tax_id: '15350946056',
    phone_number: '71999990007',
    role: 'STUDENT',
    status: null,
    link_to_lattes: null,
    has_admin_privileges: false
  },
  doctorateStudent: {
    name: 'Doutoranda E2E',
    email: 'estudante4.e2e@sgb.test',
    tax_id: '87748248800',
    phone_number: '71999990008',
    role: 'STUDENT',
    status: null,
    link_to_lattes: null,
    has_admin_privileges: false
  },
  /** Só para os testes de senha errada: o limite de 5 tentativas é por conta. */
  wrongPassword: {
    name: 'Login Bloqueio E2E',
    email: 'login.bloqueio.e2e@sgb.test',
    tax_id: null,
    phone_number: null,
    role: 'ADVISOR',
    status: 'ACTIVE',
    link_to_lattes: null,
    has_admin_privileges: false
  },
  /** Sem matrícula: pode ser excluído pelos testes. */
  unlinked: {
    name: 'Sem Vinculo E2E',
    email: 'sem.vinculo.e2e@sgb.test',
    tax_id: null,
    phone_number: null,
    role: 'ADVISOR',
    status: 'ACTIVE',
    link_to_lattes: null,
    has_admin_privileges: false
  }
} as const satisfies Record<string, SeedUser>

export type E2eUserKey = keyof typeof E2E_USERS

export const E2E_AGENCIES = {
  capes: { name: 'CAPES', masters: 10, doctorate: 10 },
  cnpq: { name: 'CNPQ', masters: 6, doctorate: 6 },
  fapesb: { name: 'FAPESB', masters: 6, doctorate: 6 },
  outras: { name: 'OUTRAS', masters: 2, doctorate: 2 },
  /** Sem bolsas: pode ser excluída pelos testes. */
  unlinked: { name: 'AGENCIA SEM BOLSAS E2E', masters: 1, doctorate: 1 }
} as const

export const E2E_ALLOCATIONS = {
  pgcomp: 'Alocação PGCOMP E2E',
  /** Sem bolsas: pode ser excluída pelos testes. */
  unlinked: 'Alocação sem bolsas E2E'
} as const

export const E2E_NOTIFICATION_COUNT = 15

export function addMonths(day: CalendarDay, months: number): CalendarDay {
  const [year, month, date] = day.split('-').map(Number)
  const result = new Date(Date.UTC(year, month - 1 + months, date))
  return result.toISOString().slice(0, 10)
}

interface ScholarshipPlan {
  student: E2eUserKey
  advisor: E2eUserKey
  program: 'MESTRADO' | 'DOUTORADO'
  enrollmentNumber: string
  agency: keyof typeof E2E_AGENCIES
  startsInMonths: number
  endsInMonths: number
  extensionInMonths: number | null
  salary: number
}

/**
 * Os prazos são relativos a hoje, para que "ativa", "finalizada" e
 * "prorrogada" continuem verdadeiros em qualquer dia em que o CI rodar. Só a
 * finalizada passa da duração esperada do curso (50 meses de doutorado), para
 * o aviso de duração ter um caso conhecido.
 */
export const E2E_SCHOLARSHIPS: Record<string, ScholarshipPlan> = {
  active: {
    student: 'student',
    advisor: 'advisor',
    program: 'MESTRADO',
    enrollmentNumber: '2025100001',
    agency: 'capes',
    startsInMonths: -6,
    endsInMonths: 17,
    extensionInMonths: null,
    salary: 2100
  },
  extended: {
    student: 'otherStudent',
    advisor: 'otherAdvisor',
    program: 'MESTRADO',
    enrollmentNumber: '2024100002',
    agency: 'fapesb',
    startsInMonths: -24,
    endsInMonths: -1,
    extensionInMonths: 5,
    salary: 2100
  },
  finished: {
    student: 'finishedStudent',
    advisor: 'advisor',
    program: 'DOUTORADO',
    enrollmentNumber: '2021200003',
    agency: 'cnpq',
    startsInMonths: -52,
    endsInMonths: -2,
    extensionInMonths: null,
    salary: 3100
  },
  doctorate: {
    student: 'doctorateStudent',
    advisor: 'advisorAdmin',
    program: 'DOUTORADO',
    enrollmentNumber: '2024200004',
    agency: 'capes',
    startsInMonths: -12,
    endsInMonths: 35,
    extensionInMonths: null,
    salary: 3100
  }
}

const RESET_TABLES = [
  'embed_notification',
  'scholarship',
  'enrollment',
  'allocation',
  'agency',
  'verification_code',
  'users'
]

/**
 * Apaga as tabelas do domínio e recria os dados fixos do e2e. Chama a trava
 * antes de qualquer acesso ao banco: fora de um banco local `*_e2e` com
 * `NODE_ENV=test`, nada é executado.
 */
export async function seedE2e(
  dataSource: DataSource,
  environment: E2eEnvironment,
  today: CalendarDay
): Promise<void> {
  assertE2eDatabase(environment)

  await dataSource.transaction(async (manager) => {
    await manager.query(
      `TRUNCATE ${RESET_TABLES.map((table) => `"${table}"`).join(
        ', '
      )} RESTART IDENTITY CASCADE`
    )

    const password = await hashPassword(E2E_PASSWORD)
    const users = {} as Record<E2eUserKey, User>
    for (const [key, data] of Object.entries(E2E_USERS)) {
      users[key as E2eUserKey] = await manager
        .getRepository(User)
        .save(manager.getRepository(User).create({ ...data, password }))
    }

    const agencies = {} as Record<keyof typeof E2E_AGENCIES, Agency>
    for (const [key, data] of Object.entries(E2E_AGENCIES)) {
      agencies[key as keyof typeof E2E_AGENCIES] = await manager
        .getRepository(Agency)
        .save(
          manager.getRepository(Agency).create({
            name: data.name,
            description: `Agência ${data.name} do ambiente e2e`,
            masters_degree_awarded_scholarships: data.masters,
            doctorate_degree_awarded_scholarships: data.doctorate
          })
        )
    }

    const allocations = {} as Record<keyof typeof E2E_ALLOCATIONS, Allocation>
    for (const [key, name] of Object.entries(E2E_ALLOCATIONS)) {
      allocations[key as keyof typeof E2E_ALLOCATIONS] = await manager
        .getRepository(Allocation)
        .save(manager.getRepository(Allocation).create({ name }))
    }

    for (const plan of Object.values(E2E_SCHOLARSHIPS)) {
      const startsAt = addMonths(today, plan.startsInMonths)
      const enrollment = await manager.getRepository(Enrollment).save(
        manager.getRepository(Enrollment).create({
          student_id: users[plan.student].id,
          advisor_id: users[plan.advisor].id,
          enrollment_number: plan.enrollmentNumber,
          enrollment_program: plan.program,
          enrollment_date: startsAt,
          defense_prediction_date: addMonths(
            startsAt,
            plan.program === 'MESTRADO' ? 24 : 48
          )
        })
      )

      await manager.getRepository(Scholarship).save(
        manager.getRepository(Scholarship).create({
          enrollment_id: enrollment.id,
          agency_id: agencies[plan.agency].id,
          allocation_id: allocations.pgcomp.id,
          scholarship_starts_at: startsAt,
          scholarship_ends_at: addMonths(today, plan.endsInMonths),
          extension_ends_at:
            plan.extensionInMonths === null
              ? null
              : addMonths(today, plan.extensionInMonths),
          salary: plan.salary
        })
      )
    }

    const notifications = Array.from(
      { length: E2E_NOTIFICATION_COUNT },
      (_, index) =>
        manager.getRepository(EmbedNotification).create({
          owner_id: users.admin.id,
          owner_type: 'ADMIN',
          title: `Notificação E2E ${index + 1}`,
          description: 'Notificação criada pelo seed do ambiente e2e.',
          consumed: index % 3 === 0
        })
    )
    await manager.getRepository(EmbedNotification).save(notifications)
  })
}
