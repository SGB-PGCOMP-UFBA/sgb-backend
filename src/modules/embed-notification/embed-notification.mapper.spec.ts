import { describe, expect, it } from 'vitest'
import { makeEmbedNotification } from '@/core/testing/factories'
import { EmbedNotificationMapper } from './embed-notification.mapper'

describe('EmbedNotificationMapper.simplified', () => {
  it('quando mapeia a notificação, expõe só a identificação dela e do dono', () => {
    const simplified = EmbedNotificationMapper.simplified(
      makeEmbedNotification({
        id: 31,
        created_at: new Date('2025-06-01T10:00:00.000Z'),
        updated_at: new Date('2025-06-02T10:00:00.000Z')
      })
    )

    expect(simplified).toEqual({
      id: 31,
      owner_id: 7,
      owner_type: 'STUDENT',
      created_at: new Date('2025-06-01T10:00:00.000Z'),
      updated_at: new Date('2025-06-02T10:00:00.000Z')
    })
  })

  it('quando mapeia a notificação, omite título, descrição e estado de leitura', () => {
    const simplified = EmbedNotificationMapper.simplified(
      makeEmbedNotification()
    ) as Record<string, unknown>

    expect(simplified.title).toBeUndefined()
    expect(simplified.description).toBeUndefined()
    expect(simplified.consumed).toBeUndefined()
  })
})

describe('EmbedNotificationMapper.detailed', () => {
  it('quando mapeia a notificação, acrescenta conteúdo e estado de leitura sem perder o simplified', () => {
    const detailed = EmbedNotificationMapper.detailed(
      makeEmbedNotification({
        id: 31,
        title: 'Bolsa prorrogada',
        description: 'Sua bolsa foi prorrogada por mais 6 meses.',
        created_at: new Date('2025-06-01T10:00:00.000Z'),
        updated_at: new Date('2025-06-02T10:00:00.000Z')
      })
    )

    expect(detailed).toEqual({
      id: 31,
      owner_id: 7,
      owner_type: 'STUDENT',
      title: 'Bolsa prorrogada',
      description: 'Sua bolsa foi prorrogada por mais 6 meses.',
      consumed: false,
      created_at: new Date('2025-06-01T10:00:00.000Z'),
      updated_at: new Date('2025-06-02T10:00:00.000Z')
    })
  })

  it.each([[false], [true]])(
    'quando a notificação é detalhada, propaga o estado de leitura (%s)',
    (consumed) => {
      const detailed = EmbedNotificationMapper.detailed(
        makeEmbedNotification({ consumed })
      )

      expect(detailed.consumed).toBe(consumed)
    }
  )

  it.each([['ADMIN'], ['ADVISOR'], ['STUDENT']])(
    'quando a notificação é detalhada, preserva o tipo de dono que ela endereça (%s)',
    (ownerType) => {
      const detailed = EmbedNotificationMapper.detailed(
        makeEmbedNotification({ owner_type: ownerType })
      )

      expect(detailed.owner_type).toBe(ownerType)
    }
  )
})
