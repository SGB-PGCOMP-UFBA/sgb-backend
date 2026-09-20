import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAdmin,
  makeAdvisor,
  makeAgency,
  makeEnrollment,
  makeScholarship,
  makeStudent
} from '@/common/testing/factories'
import { ScholarshipEndingReminderService } from './scholarship-ending-reminder.service'

const HOJE = new Date(2026, 8, 1, 7, 0, 0)
const DAQUI_A_UM_MES = new Date(2026, 9, 1)
const DAQUI_A_TRES_MESES = new Date(2026, 10, 30)

function buildScholarship(
  endsAt: Date,
  overrides: Record<string, unknown> = {}
) {
  return makeScholarship({
    id: 1,
    scholarship_ends_at: endsAt,
    extension_ends_at: null,
    agency: makeAgency(),
    enrollment: makeEnrollment({
      student: makeStudent({
        id: 7,
        name: 'Maria Souza',
        email: 'maria@ufba.br'
      }),
      advisor: makeAdvisor({ id: 20 })
    }),
    ...overrides
  })
}

describe('ScholarshipEndingReminderService', () => {
  let adminService: { findAll: ReturnType<typeof vi.fn> }
  let emailService: { sendEmail: ReturnType<typeof vi.fn> }
  let embedNotificationService: { create: ReturnType<typeof vi.fn> }
  let scholarshipService: { findAllForNotification: ReturnType<typeof vi.fn> }
  let service: ScholarshipEndingReminderService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(HOJE)

    adminService = { findAll: vi.fn().mockResolvedValue([makeAdmin()]) }
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    embedNotificationService = { create: vi.fn().mockResolvedValue(undefined) }
    scholarshipService = {
      findAllForNotification: vi.fn().mockResolvedValue([])
    }

    service = new ScholarshipEndingReminderService(
      adminService as never,
      emailService as never,
      embedNotificationService as never,
      scholarshipService as never
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('envia e-mail ao estudante quando falta um mês, com a data de vencimento', async () => {
    scholarshipService.findAllForNotification.mockResolvedValue([
      buildScholarship(DAQUI_A_UM_MES)
    ])

    await service.notifyAlmostEndedScholarships()

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1)

    const [enviado] = emailService.sendEmail.mock.calls[0]

    expect(enviado.to).toBe('maria@ufba.br')
    expect(enviado.template).toBe('notify-scholarship-finishing')
    expect(enviado.context).toEqual({
      name: 'Maria Souza',
      endsAt: '01/10/2026'
    })
  })

  it('não envia e-mail nos marcos anteriores, só a notificação in-app', async () => {
    scholarshipService.findAllForNotification.mockResolvedValue([
      buildScholarship(DAQUI_A_TRES_MESES)
    ])

    await service.notifyAlmostEndedScholarships()

    expect(emailService.sendEmail).not.toHaveBeenCalled()
    expect(embedNotificationService.create).toHaveBeenCalledTimes(3)
  })

  it('ignora bolsa que não cai em nenhum marco', async () => {
    scholarshipService.findAllForNotification.mockResolvedValue([
      buildScholarship(new Date(2026, 8, 17))
    ])

    await service.notifyAlmostEndedScholarships()

    expect(emailService.sendEmail).not.toHaveBeenCalled()
    expect(embedNotificationService.create).not.toHaveBeenCalled()
  })

  it('considera a prorrogação para decidir o marco', async () => {
    scholarshipService.findAllForNotification.mockResolvedValue([
      buildScholarship(new Date(2026, 5, 30), {
        extension_ends_at: DAQUI_A_UM_MES
      })
    ])

    await service.notifyAlmostEndedScholarships()

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    expect(emailService.sendEmail.mock.calls[0][0].context.endsAt).toBe(
      '01/10/2026'
    )
  })
})
