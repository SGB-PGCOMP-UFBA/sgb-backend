import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind
} from '@/common/testing/wiring'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'
import { EmbedNotificationService } from '@/embed-notification/embed-notification.service'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'

describe('EmbedNotificationModule', () => {
  it('monta o EmbedNotificationService a partir do repositório exportado globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      EmbedNotificationModule,
      [EmbedNotification],
      [
        {
          provide: EmbedNotificationRepository,
          useClass: TypeOrmEmbedNotificationRepository
        }
      ]
    )

    expect(moduleRef.get(EmbedNotificationService)).toBeInstanceOf(
      EmbedNotificationService
    )
    expect(moduleRef.get(EmbedNotificationRepository)).toBeInstanceOf(
      TypeOrmEmbedNotificationRepository
    )
  })

  it('o DatabaseModule real amarra e exporta o EmbedNotificationRepository', () => {
    expectDatabaseModuleToBind(
      EmbedNotificationRepository,
      TypeOrmEmbedNotificationRepository
    )
  })
})
