import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAdmin,
  makeAgency,
  makeEnrollment,
  makeScholarship,
  makeStudent
} from '@/common/testing/factories'
import { ScholarshipMonthlyReportService } from './scholarship-monthly-report.service'

const PRIMEIRO_DIA_DO_MES = new Date(2026, 8, 1, 7, 0, 0)

function buildScholarship(
  id: number,
  studentName: string,
  endsAt: Date,
  overrides: Record<string, unknown> = {}
) {
  return makeScholarship({
    id,
    scholarship_ends_at: endsAt,
    extension_ends_at: null,
    agency: makeAgency({ name: 'CAPES' }),
    enrollment: makeEnrollment({
      enrollment_program: 'MESTRADO',
      student: makeStudent({ id, name: studentName })
    }),
    ...overrides
  })
}

describe('ScholarshipMonthlyReportService', () => {
  let scholarshipRepository: {
    findAllEndingBetween: ReturnType<typeof vi.fn>
  }
  let adminRepository: { findAllOrderedByName: ReturnType<typeof vi.fn> }
  let emailService: { sendEmail: ReturnType<typeof vi.fn> }
  let service: ScholarshipMonthlyReportService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(PRIMEIRO_DIA_DO_MES)

    scholarshipRepository = {
      findAllEndingBetween: vi.fn().mockResolvedValue([])
    }
    adminRepository = {
      findAllOrderedByName: vi.fn().mockResolvedValue([makeAdmin()])
    }
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }

    service = new ScholarshipMonthlyReportService(
      adminRepository as never,
      emailService as never,
      scholarshipRepository as never
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('consulta o intervalo do mês corrente', async () => {
    await service.notifyAdminsAboutScholarshipsEndingThisMonth()

    expect(scholarshipRepository.findAllEndingBetween).toHaveBeenCalledWith(
      '2026-09-01',
      '2026-09-30'
    )
  })

  it('não envia nada quando nenhuma bolsa encerra no mês', async () => {
    await service.notifyAdminsAboutScholarshipsEndingThisMonth()

    expect(adminRepository.findAllOrderedByName).not.toHaveBeenCalled()
    expect(emailService.sendEmail).not.toHaveBeenCalled()
  })

  it('envia um e-mail por admin com a tabela das bolsas do mês', async () => {
    scholarshipRepository.findAllEndingBetween.mockResolvedValue([
      buildScholarship(1, 'Maria Souza', new Date(2026, 8, 10)),
      buildScholarship(2, 'João Lima', new Date(2026, 8, 25))
    ])
    adminRepository.findAllOrderedByName.mockResolvedValue([
      makeAdmin({ id: 3, name: 'Carlos Lima', email: 'carlos@ufba.br' }),
      makeAdmin({ id: 4, name: 'Ana Dias', email: 'ana@ufba.br' })
    ])

    await service.notifyAdminsAboutScholarshipsEndingThisMonth()

    expect(emailService.sendEmail).toHaveBeenCalledTimes(2)

    const [primeiro] = emailService.sendEmail.mock.calls[0]

    expect(primeiro.to).toBe('carlos@ufba.br')
    expect(primeiro.template).toBe('notify-admin-scholarships-ending')
    expect(primeiro.subject).toBe('Bolsas encerrando em setembro de 2026')
    expect(primeiro.context).toMatchObject({
      name: 'Carlos Lima',
      monthLabel: 'setembro de 2026',
      total: 2,
      scholarships: [
        {
          studentName: 'Maria Souza',
          agencyName: 'CAPES',
          program: 'MESTRADO',
          endsAt: '10/09/2026'
        },
        {
          studentName: 'João Lima',
          agencyName: 'CAPES',
          program: 'MESTRADO',
          endsAt: '25/09/2026'
        }
      ]
    })
  })

  it('usa a data de prorrogação quando a bolsa foi estendida', async () => {
    scholarshipRepository.findAllEndingBetween.mockResolvedValue([
      buildScholarship(1, 'Maria Souza', new Date(2026, 7, 10), {
        extension_ends_at: new Date(2026, 8, 20)
      })
    ])

    await service.notifyAdminsAboutScholarshipsEndingThisMonth()

    const [enviado] = emailService.sendEmail.mock.calls[0]

    expect(enviado.context.scholarships[0].endsAt).toBe('20/09/2026')
  })
})
