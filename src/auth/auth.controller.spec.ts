import { INestApplication, UnauthorizedException } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { Test } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthController } from '@/auth/auth.controller'
import { AuthService } from '@/auth/auth.service'
import { LocalStrategy } from '@/auth/strategies/local.strategy'
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter'
import { constants } from '@/common/utils/constants'
import { CREDENTIALS_THROTTLER_OPTIONS } from '@/config/credentials-throttler.constant'

const messages = constants.exceptionMessages.auth

describe('AuthController (POST /login)', () => {
  let app: INestApplication
  let authService: {
    validateUser: ReturnType<typeof vi.fn>
    login: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    authService = {
      validateUser: vi
        .fn()
        .mockRejectedValue(
          new UnauthorizedException(messages.INVALID_CREDENTIALS)
        ),
      login: vi.fn().mockResolvedValue({ access_token: 'token' })
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        ThrottlerModule.forRoot(CREDENTIALS_THROTTLER_OPTIONS)
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        LocalStrategy
      ]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  function login(email: string) {
    return request(app.getHttpServer())
      .post('/login')
      .send({ email, password: 'Senha@123', role: 'STUDENT' })
  }

  it('quando as credenciais não conferem, responde 401 com a mensagem genérica', async () => {
    const response = await login('ana@ufba.br')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      statusCode: 401,
      message: messages.INVALID_CREDENTIALS
    })
  })

  it('depois de 5 tentativas para o mesmo e-mail, responde 429 sem validar a senha', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await login('ana@ufba.br')).status).toBe(401)
    }

    const blocked = await login('ana@ufba.br')

    expect(blocked.status).toBe(429)
    expect(blocked.body.message).toBe(messages.TOO_MANY_ATTEMPTS)
    expect(authService.validateUser).toHaveBeenCalledTimes(5)
  })

  it('quando um e-mail é bloqueado, outro e-mail do mesmo IP continua podendo entrar', async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      await login('ana@ufba.br')
    }

    expect((await login('bia@ufba.br')).status).toBe(401)
  })

  it('quando o mesmo IP percorre muitos e-mails, bloqueia pelo IP', async () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      expect((await login(`pessoa${attempt}@ufba.br`)).status).toBe(401)
    }

    expect((await login('mais-uma@ufba.br')).status).toBe(429)
  })
})
