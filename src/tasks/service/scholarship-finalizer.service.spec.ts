import { InternalServerErrorException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScholarShipFinalizerService } from './scholarship-finalizer.service'

const HOJE = new Date('2026-06-30T00:00:00.000Z')

function buildScholarship(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: 'ON_GOING',
    scholarship_ends_at: new Date('2026-06-30T00:00:00.000Z'),
    extension_ends_at: null,
    agency: { id: 1, name: 'CAPES' },
    enrollment: {
      enrollment_number: '2024123456',
      enrollment_program: 'MESTRADO',
      student: { id: 10, role: 'STUDENT', name: 'Maria Souza' },
      advisor: { id: 20, role: 'ADVISOR', name: 'Prof. Silva' }
    },
    ...overrides
  } as never
}

describe('ScholarShipFinalizerService', () => {
  let scholarshipService: {
    findAllEndingToday: ReturnType<typeof vi.fn>
    finishScholarship: ReturnType<typeof vi.fn>
    extendScholarship: ReturnType<typeof vi.fn>
  }
  let embedNotificationService: { create: ReturnType<typeof vi.fn> }
  let service: ScholarShipFinalizerService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(HOJE)

    scholarshipService = {
      findAllEndingToday: vi.fn().mockResolvedValue([]),
      finishScholarship: vi.fn().mockResolvedValue(undefined),
      extendScholarship: vi.fn().mockResolvedValue(undefined)
    }
    embedNotificationService = { create: vi.fn().mockResolvedValue(undefined) }

    service = new ScholarShipFinalizerService(
      scholarshipService as never,
      embedNotificationService as never
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('quando nenhuma bolsa vence hoje, não mexe em nada', async () => {
    await service.notifyAlmostEndedScholarships()

    expect(scholarshipService.finishScholarship).not.toHaveBeenCalled()
    expect(scholarshipService.extendScholarship).not.toHaveBeenCalled()
    expect(embedNotificationService.create).not.toHaveBeenCalled()
  })

  describe('decisão entre finalizar e prorrogar', () => {
    it('quando a bolsa ON_GOING tem data de prorrogação, prorroga em vez de finalizar', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({
          id: 7,
          extension_ends_at: new Date('2026-12-31T00:00:00.000Z')
        })
      ])

      await service.notifyAlmostEndedScholarships()

      expect(scholarshipService.extendScholarship).toHaveBeenCalledWith(7)
      expect(scholarshipService.finishScholarship).not.toHaveBeenCalled()
    })

    it('quando a bolsa ON_GOING não tem data de prorrogação, finaliza a bolsa', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({ id: 8, extension_ends_at: null })
      ])

      await service.notifyAlmostEndedScholarships()

      expect(scholarshipService.finishScholarship).toHaveBeenCalledWith(8)
      expect(scholarshipService.extendScholarship).not.toHaveBeenCalled()
    })

    it('quando a prorrogação da bolsa EXTENDED vence, finaliza sem prorrogar de novo', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({
          id: 9,
          status: 'EXTENDED',
          extension_ends_at: new Date('2026-06-30T00:00:00.000Z')
        })
      ])

      await service.notifyAlmostEndedScholarships()

      expect(scholarshipService.finishScholarship).toHaveBeenCalledWith(9)
      expect(scholarshipService.extendScholarship).not.toHaveBeenCalled()
    })

    it.each([['ON_GOING', new Date('2026-12-31T00:00:00.000Z'), 'extend']])(
      'quando a bolsa em andamento tem data de prorrogação, prorroga a bolsa (%s)',
      async (status, extensionEndsAt, esperado) => {
        scholarshipService.findAllEndingToday.mockResolvedValue([
          buildScholarship({
            id: 3,
            status,
            extension_ends_at: extensionEndsAt
          })
        ])

        await service.notifyAlmostEndedScholarships()

        if (esperado === 'extend') {
          expect(scholarshipService.extendScholarship).toHaveBeenCalledWith(3)
          expect(scholarshipService.finishScholarship).not.toHaveBeenCalled()
        } else {
          expect(scholarshipService.finishScholarship).toHaveBeenCalledWith(3)
          expect(scholarshipService.extendScholarship).not.toHaveBeenCalled()
        }
      }
    )

    it.each([['ON_GOING', null, 'finish']])(
      'quando não há data de prorrogação, finaliza a bolsa (%s)',
      async (status, extensionEndsAt, esperado) => {
        scholarshipService.findAllEndingToday.mockResolvedValue([
          buildScholarship({
            id: 3,
            status,
            extension_ends_at: extensionEndsAt
          })
        ])

        await service.notifyAlmostEndedScholarships()

        if (esperado === 'extend') {
          expect(scholarshipService.extendScholarship).toHaveBeenCalledWith(3)
          expect(scholarshipService.finishScholarship).not.toHaveBeenCalled()
        } else {
          expect(scholarshipService.finishScholarship).toHaveBeenCalledWith(3)
          expect(scholarshipService.extendScholarship).not.toHaveBeenCalled()
        }
      }
    )

    it.each([
      ['EXTENDED', new Date('2026-06-30T00:00:00.000Z'), 'finish'],
      ['EXTENDED', null, 'finish']
    ])(
      'quando o status não permite prorrogação, finaliza a bolsa (%s)',
      async (status, extensionEndsAt, esperado) => {
        scholarshipService.findAllEndingToday.mockResolvedValue([
          buildScholarship({
            id: 3,
            status,
            extension_ends_at: extensionEndsAt
          })
        ])

        await service.notifyAlmostEndedScholarships()

        if (esperado === 'extend') {
          expect(scholarshipService.extendScholarship).toHaveBeenCalledWith(3)
          expect(scholarshipService.finishScholarship).not.toHaveBeenCalled()
        } else {
          expect(scholarshipService.finishScholarship).toHaveBeenCalledWith(3)
          expect(scholarshipService.extendScholarship).not.toHaveBeenCalled()
        }
      }
    )

    it('quando a data de prorrogação já passou, prorroga a bolsa mesmo assim', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({
          id: 11,
          extension_ends_at: new Date('2025-01-01T00:00:00.000Z')
        })
      ])

      await service.notifyAlmostEndedScholarships()

      expect(scholarshipService.extendScholarship).toHaveBeenCalledWith(11)
      expect(scholarshipService.finishScholarship).not.toHaveBeenCalled()
    })
  })

  describe('notificações', () => {
    it('quando a bolsa é finalizada, avisa estudante e orientador', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship()
      ])

      await service.notifyAlmostEndedScholarships()

      expect(embedNotificationService.create).toHaveBeenCalledTimes(2)
      expect(embedNotificationService.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          owner_id: 10,
          owner_type: 'STUDENT',
          title: 'Sua bolsa CAPES expirou!'
        })
      )
      expect(embedNotificationService.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          owner_id: 20,
          owner_type: 'ADVISOR',
          title: 'A bolsa de Maria Souza expirou!'
        })
      )
    })

    it('quando a bolsa apenas é prorrogada, não notifica ninguém', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({
          extension_ends_at: new Date('2026-12-31T00:00:00.000Z')
        })
      ])

      await service.notifyAlmostEndedScholarships()

      expect(embedNotificationService.create).not.toHaveBeenCalled()
    })

    it('quando a bolsa vence, notifica só depois de finalizar', async () => {
      const ordem: string[] = []
      scholarshipService.finishScholarship.mockImplementation(async () => {
        ordem.push('finish')
      })
      embedNotificationService.create.mockImplementation(async () => {
        ordem.push('notify')
      })
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship()
      ])

      await service.notifyAlmostEndedScholarships()

      expect(ordem[0]).toBe('finish')
    })
  })

  describe('lote de bolsas', () => {
    it('quando o lote mistura finalização e prorrogação, processa todas as bolsas do dia', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({ id: 1 }),
        buildScholarship({
          id: 2,
          extension_ends_at: new Date('2026-12-31T00:00:00.000Z')
        }),
        buildScholarship({ id: 3, status: 'EXTENDED' })
      ])

      await service.notifyAlmostEndedScholarships()

      expect(scholarshipService.finishScholarship.mock.calls.flat()).toEqual([
        1, 3
      ])
      expect(scholarshipService.extendScholarship).toHaveBeenCalledWith(2)
      expect(embedNotificationService.create).toHaveBeenCalledTimes(4)
    })

    it('quando uma bolsa falha ao ser finalizada, aborta o lote inteiro', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({ id: 1 }),
        buildScholarship({ id: 2 }),
        buildScholarship({ id: 3 })
      ])
      scholarshipService.finishScholarship.mockImplementation(
        async (id: number) => {
          if (id === 2)
            throw new InternalServerErrorException(
              "Can't finish this scholarship."
            )
        }
      )

      await expect(
        service.notifyAlmostEndedScholarships()
      ).rejects.toBeInstanceOf(InternalServerErrorException)

      expect(scholarshipService.finishScholarship.mock.calls.flat()).toEqual([
        1, 2
      ])
    })

    it('quando uma bolsa vem sem as relações carregadas, aborta o lote', async () => {
      scholarshipService.findAllEndingToday.mockResolvedValue([
        buildScholarship({ id: 1, enrollment: null }),
        buildScholarship({ id: 2 })
      ])

      await expect(service.notifyAlmostEndedScholarships()).rejects.toThrow()

      expect(scholarshipService.finishScholarship).not.toHaveBeenCalledWith(2)
    })
  })
})
