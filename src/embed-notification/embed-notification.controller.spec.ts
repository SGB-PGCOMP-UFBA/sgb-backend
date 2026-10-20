import { ExecutionContext, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter'
import { makeEmbedNotification } from '@/common/testing/factories'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { EmbedNotificationController } from './embed-notification.controller'
import { EmbedNotificationService } from './embed-notification.service'

const ANA = { userId: '7-STUDENT', role: 'STUDENT' }
const BIA = { userId: '8-STUDENT', role: 'STUDENT' }

const NOTIFICATIONS = [
  makeEmbedNotification({ id: 55, owner_id: 7, owner_type: 'STUDENT' }),
  makeEmbedNotification({ id: 56, owner_id: 8, owner_type: 'STUDENT' })
]

class InMemoryEmbedNotificationRepository {
  consumed: number[] = []

  async findPendingByOwner(ownerId: number, ownerType: string) {
    return NOTIFICATIONS.filter(
      (n) => n.owner_id === ownerId && n.owner_type === ownerType
    )
  }

  async findByIdAndOwner(id: number, ownerId: number, ownerType: string) {
    return (
      NOTIFICATIONS.find(
        (n) =>
          n.id === id && n.owner_id === ownerId && n.owner_type === ownerType
      ) ?? null
    )
  }

  async markAsConsumed(id: number) {
    this.consumed.push(id)
  }
}

describe('EmbedNotificationController', () => {
  let app: INestApplication
  let repository: InMemoryEmbedNotificationRepository
  let loggedUser: typeof ANA | undefined

  beforeEach(async () => {
    repository = new InMemoryEmbedNotificationRepository()
    loggedUser = ANA

    const moduleRef = await Test.createTestingModule({
      controllers: [EmbedNotificationController],
      providers: [
        EmbedNotificationService,
        { provide: EmbedNotificationRepository, useValue: repository }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = loggedUser
          return true
        }
      })
      .compile()

    app = moduleRef.createNestApplication()
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /v1/embed-notification', () => {
    it('quando o usuário lista, devolve só as notificações dele', async () => {
      const response = await request(app.getHttpServer()).get(
        '/v1/embed-notification'
      )

      expect(response.status).toBe(200)
      expect(response.body.map((n: { id: number }) => n.id)).toEqual([55])
    })

    it('quando a URL aponta para outro dono, ignora a URL e usa o dono do token', async () => {
      const response = await request(app.getHttpServer()).get(
        '/v1/embed-notification?owner_id=8&owner_type=STUDENT'
      )

      expect(response.body.map((n: { id: number }) => n.id)).toEqual([55])
    })
  })

  describe('PATCH /v1/embed-notification/consume/:id', () => {
    it('quando a notificação é do usuário, marca como lida', async () => {
      const response = await request(app.getHttpServer()).patch(
        '/v1/embed-notification/consume/55'
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({ id: 55, consumed: true })
      expect(repository.consumed).toEqual([55])
    })

    it.each([
      ['de outro usuário', 56],
      ['inexistente', 999]
    ])(
      'quando a notificação é %s, responde 404 sem alterar nada',
      async (_, id) => {
        const response = await request(app.getHttpServer()).patch(
          `/v1/embed-notification/consume/${id}`
        )

        expect(response.status).toBe(404)
        expect(repository.consumed).toEqual([])
      }
    )

    it('quando o id não é número, responde 400', async () => {
      const response = await request(app.getHttpServer()).patch(
        '/v1/embed-notification/consume/abc'
      )

      expect(response.status).toBe(400)
    })

    it('quando outro usuário tenta consumir a notificação de alguém, responde 404', async () => {
      loggedUser = BIA

      const response = await request(app.getHttpServer()).patch(
        '/v1/embed-notification/consume/55'
      )

      expect(response.status).toBe(404)
    })
  })
})
