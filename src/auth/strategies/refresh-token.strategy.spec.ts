import { INestApplication, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Test } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthController } from '@/auth/auth.controller'
import { AuthService } from '@/auth/auth.service'
import { RefreshTokenStrategy } from '@/auth/strategies/refresh-token.strategy'
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter'
import { constants } from '@/common/utils/constants'
import { CREDENTIALS_THROTTLER_OPTIONS } from '@/config/credentials-throttler.constant'

const jwt = new JwtService({})

const REFRESH_PAYLOAD = {
  type: 'refresh',
  sub: '10-STUDENT',
  role: 'STUDENT',
  authenticated_at: '2026-05-10T12:00:00.000Z'
}

function signRefresh(
  overrides: { secret?: string; expiresIn?: number } = {}
): string {
  return jwt.sign(REFRESH_PAYLOAD, {
    secret: overrides.secret ?? constants.jwt.REFRESH_SECRET_KEY,
    expiresIn: overrides.expiresIn ?? 60,
    jwtid: 'token-1'
  })
}

describe('RefreshTokenStrategy (POST /login/refresh e /logout)', () => {
  const SESSION = {
    user: { id: 10, role: 'STUDENT' },
    tokenId: 'token-1',
    authenticatedAt: '2026-05-10T12:00:00.000Z'
  }

  let app: INestApplication
  let authService: Record<
    'validateRefreshToken' | 'refresh' | 'logout',
    ReturnType<typeof vi.fn>
  >

  beforeEach(async () => {
    authService = {
      validateRefreshToken: vi.fn().mockResolvedValue(SESSION),
      refresh: vi
        .fn()
        .mockResolvedValue({ access_token: 'a', refresh_token: 'r' }),
      logout: vi.fn().mockResolvedValue(undefined)
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        ThrottlerModule.forRoot(CREDENTIALS_THROTTLER_OPTIONS)
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        RefreshTokenStrategy
      ]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalFilters(new AllExceptionsFilter())
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  function post(path: string, body: object) {
    return request(app.getHttpServer()).post(path).send(body)
  }

  it('quando o refresh token é válido, responde 200 com o par novo', async () => {
    const token = signRefresh()

    const response = await post('/login/refresh', { refresh_token: token })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ access_token: 'a', refresh_token: 'r' })
    expect(authService.validateRefreshToken).toHaveBeenCalledWith(
      token,
      expect.objectContaining({ ...REFRESH_PAYLOAD, jti: 'token-1' })
    )
    expect(authService.refresh).toHaveBeenCalledWith(SESSION)
  })

  it.each([
    ['sem refresh token', {}],
    [
      'com token assinado pelo segredo do access',
      {
        refresh_token: signRefresh({ secret: constants.jwt.SECRET_KEY })
      }
    ],
    ['com token expirado', { refresh_token: signRefresh({ expiresIn: -1 }) }],
    ['com texto que não é JWT', { refresh_token: 'qualquer-coisa' }]
  ])('quando chega %s, responde 401 sem consultar o banco', async (_, body) => {
    const response = await post('/login/refresh', body)

    expect(response.status).toBe(401)
    expect(authService.validateRefreshToken).not.toHaveBeenCalled()
    expect(authService.refresh).not.toHaveBeenCalled()
  })

  it('quando o service recusa o token (revogado, reusado, usuário apagado), responde 401 com a mensagem de sessão expirada', async () => {
    authService.validateRefreshToken.mockRejectedValue(
      new UnauthorizedException(
        constants.exceptionMessages.auth.SESSION_EXPIRED
      )
    )

    const response = await post('/login/refresh', {
      refresh_token: signRefresh()
    })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      statusCode: 401,
      message: constants.exceptionMessages.auth.SESSION_EXPIRED
    })
  })

  it('quando sai com um refresh token válido, revoga a sessão e responde 204', async () => {
    const response = await post('/logout', { refresh_token: signRefresh() })

    expect(response.status).toBe(204)
    expect(authService.logout).toHaveBeenCalledWith(SESSION)
  })

  it('quando renova, não aplica o limite por conta (5 em 15 min) a quem divide o IP', async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      expect(
        (await post('/login/refresh', { refresh_token: signRefresh() })).status
      ).toBe(200)
    }
  })

  it('quando o mesmo IP renova demais, bloqueia pelo IP', async () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      await post('/login/refresh', { refresh_token: signRefresh() })
    }

    expect(
      (await post('/login/refresh', { refresh_token: signRefresh() })).status
    ).toBe(429)
  })
})
