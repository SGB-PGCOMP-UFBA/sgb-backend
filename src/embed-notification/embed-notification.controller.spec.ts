import { ExecutionContext, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter'
import { makeEmbedNotification } from '@/common/testing/factories'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationController } from './embed-notification.controller'
import { EmbedNotificationService } from './embed-notification.service'

const ANA = { userId: '7-STUDENT', role: 'STUDENT' }
const BIA = { userId: '8-STUDENT', role: 'STUDENT' }

const NOTIFICATIONS = [
  makeEmbedNotification({ id: 55, owner_id: 7, owner_type: 'STUDENT' }),
  makeEmbedNotification({ id: 56, owner_id: 8, owner_type: 'STUDENT' }),
  ...Array.from({ length: 12 }, (_, index) =>
    makeEmbedNotification({
      id: 100 + index,
      owner_id: 9,
      owner_type: 'ADVISOR',
      consumed: index % 2 === 0
    })
  )
]

const CAIO = { userId: '9-ADVISOR', role: 'ADVISOR' }

class InMemoryEmbedNotificationRepository {
  consumed: number[] = []

  async findPendingByOwner(ownerId: number, ownerType: string) {
    return NOTIFICATIONS.filter(
      (n) => n.owner_id === ownerId && n.owner_type === ownerType
    )
  }

  async findPageByOwner(
    ownerId: number,
    ownerType: string,
    options: { page: number; limit: number; onlyUnconsumed?: boolean }
  ): Promise<[EmbedNotification[], number]> {
    const owned = NOTIFICATIONS.filter(
      (n) => n.owner_id === ownerId && n.owner_type === ownerType
    )
      .map((n) => ({
        ...n,
        consumed: n.consumed || this.consumed.includes(n.id)
      }))
      .filter((n) => !options.onlyUnconsumed || !n.consumed)
      .sort((a, b) => b.id - a.id)
    const start = (options.page - 1) * options.limit
    return [owned.slice(start, start + options.limit), owned.length]
  }

  async markAllAsConsumedByOwner(ownerId: number, ownerType: string) {
    const unread = NOTIFICATIONS.filter(
      (n) =>
        n.owner_id === ownerId &&
        n.owner_type === ownerType &&
        !n.consumed &&
        !this.consumed.includes(n.id)
    )
    this.consumed.push(...unread.map((n) => n.id))
    return unread.length
  }

  async countUnconsumedByOwner(ownerId: number, ownerType: string) {
    return NOTIFICATIONS.filter(
      (n) => n.owner_id === ownerId && n.owner_type === ownerType && !n.consumed
    ).length
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
  let loggedUser: { userId: string; role: string } | undefined

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
    app.useGlobalFilters(new AllExceptionsFilter())
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

  describe('GET /v1/embed-notification/paginated', () => {
    it('quando pede a segunda página, devolve as próximas notificações, lidas e não lidas, com o meta', async () => {
      loggedUser = CAIO

      const response = await request(app.getHttpServer()).get(
        '/v1/embed-notification/paginated?page=2&limit=5'
      )

      expect(response.status).toBe(200)
      expect(response.body.items.map((n: { id: number }) => n.id)).toEqual([
        106, 105, 104, 103, 102
      ])
      expect(
        response.body.items.map((n: { consumed: boolean }) => n.consumed)
      ).toEqual([true, false, true, false, true])
      expect(response.body.meta).toEqual({
        totalItems: 12,
        itemCount: 5,
        itemsPerPage: 5,
        totalPages: 3,
        currentPage: 2
      })
    })

    it('com unread=true, pagina só as não lidas', async () => {
      loggedUser = CAIO

      const response = await request(app.getHttpServer()).get(
        '/v1/embed-notification/paginated?unread=true&limit=4'
      )

      expect(response.body.items.map((n: { id: number }) => n.id)).toEqual([
        111, 109, 107, 105
      ])
      expect(response.body.meta).toMatchObject({ totalItems: 6, totalPages: 2 })
    })

    it('sem parâmetros, usa a página 1 com 10 itens', async () => {
      loggedUser = CAIO

      const response = await request(app.getHttpServer()).get(
        '/v1/embed-notification/paginated'
      )

      expect(response.body.items).toHaveLength(10)
      expect(response.body.meta).toMatchObject({
        currentPage: 1,
        itemsPerPage: 10
      })
    })

    it.each([
      ['page=0&limit=10', 1, 10],
      ['page=1&limit=500', 1, 50],
      ['page=1&limit=0', 1, 1]
    ])(
      'quando recebe %s, corrige para página %i e limite %i',
      async (query, currentPage, itemsPerPage) => {
        loggedUser = CAIO

        const response = await request(app.getHttpServer()).get(
          `/v1/embed-notification/paginated?${query}`
        )

        expect(response.body.meta).toMatchObject({ currentPage, itemsPerPage })
      }
    )

    it.each([['page=abc'], ['unread=talvez']])(
      'com %s inválido, responde 400',
      async (query) => {
        const response = await request(app.getHttpServer()).get(
          `/v1/embed-notification/paginated?${query}`
        )

        expect(response.status).toBe(400)
      }
    )

    it('devolve só as notificações do dono do token', async () => {
      const response = await request(app.getHttpServer()).get(
        '/v1/embed-notification/paginated?owner_id=9&owner_type=ADVISOR'
      )

      expect(response.body.items.map((n: { id: number }) => n.id)).toEqual([55])
    })
  })

  describe('GET /v1/embed-notification/unread-count', () => {
    it('devolve o total de não lidas do dono do token, sem o limite de 10', async () => {
      loggedUser = CAIO

      const response = await request(app.getHttpServer()).get(
        '/v1/embed-notification/unread-count'
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ count: 6 })
    })
  })

  describe('PATCH /v1/embed-notification/consume-all', () => {
    it('marca como lidas só as não lidas do dono do token', async () => {
      loggedUser = CAIO

      const response = await request(app.getHttpServer()).patch(
        '/v1/embed-notification/consume-all'
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ updated: 6 })
      expect([...repository.consumed].sort()).toEqual([
        101, 103, 105, 107, 109, 111
      ])
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
