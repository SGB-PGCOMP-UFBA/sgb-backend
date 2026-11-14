import {
  Controller,
  Get,
  INestApplication,
  Request,
  UseGuards
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { AccessTokenStrategy } from '@/auth/strategies/access-token.strategy'
import { constants } from '@/common/utils/constants'

@Controller('/protegida')
class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  whoAmI(@Request() req: { user: unknown }) {
    return req.user
  }
}

const jwt = new JwtService({ secret: constants.jwt.SECRET_KEY })

const ACCESS_PAYLOAD = {
  type: 'access',
  sub: '10-STUDENT',
  role: 'STUDENT',
  username: 'Maria Souza',
  authenticated_at: '2026-05-10T12:00:00.000Z'
}

describe('AccessTokenStrategy', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ProtectedController],
      providers: [AccessTokenStrategy]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  function call(token: string) {
    return request(app.getHttpServer())
      .get('/protegida')
      .set('Authorization', `Bearer ${token}`)
  }

  it('quando o access token é válido, entrega quem chama no mesmo formato de antes', async () => {
    const response = await call(jwt.sign(ACCESS_PAYLOAD, { expiresIn: 60 }))

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      userId: '10-STUDENT',
      username: 'Maria Souza',
      role: 'STUDENT'
    })
  })

  it('quando o access token expirou, responde 401', async () => {
    const response = await call(jwt.sign(ACCESS_PAYLOAD, { expiresIn: -1 }))

    expect(response.status).toBe(401)
  })

  it('quando o token é de antes do refresh token (sem tipo), responde 401', async () => {
    const { type: _, ...legacy } = ACCESS_PAYLOAD

    const response = await call(jwt.sign(legacy, { expiresIn: 60 }))

    expect(response.status).toBe(401)
  })

  it('quando recebe um refresh token no lugar do access token, responde 401', async () => {
    const refresh = jwt.sign(
      { ...ACCESS_PAYLOAD, type: 'refresh' },
      { secret: constants.jwt.REFRESH_SECRET_KEY, expiresIn: 60 }
    )

    expect((await call(refresh)).status).toBe(401)
  })

  it('quando o token tem tipo refresh mas foi assinado com o segredo do access, responde 401', async () => {
    const forged = jwt.sign(
      { ...ACCESS_PAYLOAD, type: 'refresh' },
      { expiresIn: 60 }
    )

    expect((await call(forged)).status).toBe(401)
  })
})
