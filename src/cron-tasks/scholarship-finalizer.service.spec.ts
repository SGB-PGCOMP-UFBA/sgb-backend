import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAdvisor,
  makeAgency,
  makeEnrollment,
  makeScholarship,
  makeStudent
} from '@/common/testing/factories'
import { ScholarshipFinalizerService } from './scholarship-finalizer.service'

const HOJE = new Date('2026-06-30T12:00:00.000Z')

function buildScholarship(overrides: Record<string, unknown> = {}) {
  return {
    ...makeScholarship({
      id: 1,
      scholarship_ends_at: HOJE,
      agency: makeAgency(),
      enrollment: makeEnrollment({
        student: makeStudent({ id: 10, name: 'Maria Souza' }),
        advisor: makeAdvisor({ id: 20, name: 'Prof. Silva' })
      })
    }),
    ...overrides
  } as never
}

describe('ScholarshipFinalizerService', () => {
  let scholarshipService: {
    findAllEndingOn: ReturnType<typeof vi.fn>
  }
  let embedNotificationService: { create: ReturnType<typeof vi.fn> }
  let service: ScholarshipFinalizerService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(HOJE)

    scholarshipService = {
      findAllEndingOn: vi.fn().mockResolvedValue([])
    }
    embedNotificationService = { create: vi.fn().mockResolvedValue(undefined) }

    service = new ScholarshipFinalizerService(
      scholarshipService as never,
      embedNotificationService as never
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('quando nenhuma bolsa encerra hoje, não notifica ninguém', async () => {
    await service.notifyEndedScholarships()

    expect(embedNotificationService.create).not.toHaveBeenCalled()
  })

  it('quando busca as bolsas do dia, não passa filtro de data e usa o padrão de hoje', async () => {
    await service.notifyEndedScholarships()

    expect(scholarshipService.findAllEndingOn).toHaveBeenCalledWith()
  })

  it('quando a rotina roda, não escreve nada na bolsa', async () => {
    scholarshipService.findAllEndingOn.mockResolvedValue([buildScholarship()])

    await service.notifyEndedScholarships()

    expect(scholarshipService).not.toHaveProperty('finishScholarship')
    expect(scholarshipService).not.toHaveProperty('extendScholarship')
  })

  describe('notificações', () => {
    it('quando a bolsa encerra hoje, avisa estudante e orientador', async () => {
      scholarshipService.findAllEndingOn.mockResolvedValue([buildScholarship()])

      await service.notifyEndedScholarships()

      expect(embedNotificationService.create).toHaveBeenCalledTimes(2)
      expect(embedNotificationService.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          owner_id: 10,
          owner_type: 'STUDENT',
          title: 'Sua bolsa CAPES irá expirar hoje!'
        })
      )
      expect(embedNotificationService.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          owner_id: 20,
          owner_type: 'ADVISOR',
          title: 'A bolsa de Maria Souza irá expirar hoje!'
        })
      )
    })
  })

  describe('lote de bolsas', () => {
    it('quando várias bolsas encerram no mesmo dia, notifica todas', async () => {
      scholarshipService.findAllEndingOn.mockResolvedValue([
        buildScholarship({ id: 1 }),
        buildScholarship({ id: 2 }),
        buildScholarship({ id: 3 })
      ])

      await service.notifyEndedScholarships()

      expect(embedNotificationService.create).toHaveBeenCalledTimes(6)
    })

    it('quando uma bolsa vem sem as relações carregadas, aborta o lote', async () => {
      scholarshipService.findAllEndingOn.mockResolvedValue([
        buildScholarship({ id: 1, enrollment: null }),
        buildScholarship({ id: 2 })
      ])

      await expect(service.notifyEndedScholarships()).rejects.toThrow()

      expect(embedNotificationService.create).not.toHaveBeenCalled()
    })
  })
})
