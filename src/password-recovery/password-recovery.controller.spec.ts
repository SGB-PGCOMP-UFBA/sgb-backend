import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter'
import { constants } from '@/common/utils/constants'
import { CREDENTIALS_THROTTLER_OPTIONS } from '@/config/credentials-throttler.constant'
import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'

describe('PasswordRecoveryController', () => {
  let app: INestApplication
  let service: Record<
    'requestCode' | 'verifyCode' | 'confirmReset',
    ReturnType<typeof vi.fn>
  >

  beforeEach(async () => {
    service = {
      requestCode: vi.fn(),
      verifyCode: vi.fn().mockResolvedValue(undefined),
      confirmReset: vi.fn().mockResolvedValue(undefined)
    }

    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(CREDENTIALS_THROTTLER_OPTIONS)],
      controllers: [PasswordRecoveryController],
      providers: [{ provide: PasswordRecoveryService, useValue: service }]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalFilters(new AllExceptionsFilter())
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  function requestCode(email: string) {
    return request(app.getHttpServer())
      .post('/v1/passwords/recovery')
      .send({ email, role: 'STUDENT' })
  }

  it('quando o código é pedido, responde 201 sem corpo, exista a conta ou não', async () => {
    const response = await requestCode('ana@ufba.br')

    expect(response.status).toBe(201)
    expect(response.body).toEqual({})
    expect(service.requestCode).toHaveBeenCalledWith({
      email: 'ana@ufba.br',
      role: 'STUDENT'
    })
  })

  it('depois de 5 pedidos para o mesmo e-mail, responde 429', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await requestCode('ana@ufba.br')).status).toBe(201)
    }

    const blocked = await requestCode('ana@ufba.br')

    expect(blocked.status).toBe(429)
    expect(blocked.body.message).toBe(
      constants.exceptionMessages.auth.TOO_MANY_ATTEMPTS
    )
    expect(service.requestCode).toHaveBeenCalledTimes(5)
  })

  it('limita a verificação do código separadamente do pedido', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await requestCode('ana@ufba.br')
    }

    const verify = await request(app.getHttpServer())
      .post('/v1/passwords/recovery/verify')
      .send({ email: 'ana@ufba.br', role: 'STUDENT', code: '123456' })

    expect(verify.status).toBe(200)
  })
})
