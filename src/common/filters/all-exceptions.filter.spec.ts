import {
  Body,
  Controller,
  Get,
  INestApplication,
  Logger,
  NotFoundException,
  ParseIntPipe,
  Post,
  Query,
  ValidationPipe
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { EntityNotFoundError, QueryFailedError } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IsString } from 'class-validator'
import { CustomValidationException } from '@/common/exceptions/custom-validation.exception'
import { AllExceptionsFilter, toErrorResponse } from './all-exceptions.filter'

function postgresError(code: string, detail = 'Key (email)=(a@b.c) exists.') {
  return new QueryFailedError(
    'INSERT INTO "users" ...',
    [],
    Object.assign(new Error('duplicate key value violates unique constraint'), {
      code,
      constraint: 'UQ_USERS_EMAIL_ROLE',
      detail
    })
  )
}

describe('toErrorResponse', () => {
  it('mantém o status e a mensagem das exceções HTTP lançadas pelos services', () => {
    expect(
      toErrorResponse(new NotFoundException('Bolsa não encontrada.'))
    ).toEqual({ statusCode: 404, message: 'Bolsa não encontrada.' })
  })

  it('quando a mensagem vem em lista (pipes do Nest), devolve só a primeira', () => {
    const exception = new NotFoundException({
      message: ['primeira', 'segunda']
    })

    expect(toErrorResponse(exception).message).toBe('primeira')
  })

  it.each([
    ['23505', 409, 'Já existe um registro com esses dados.'],
    [
      '23503',
      409,
      'Não foi possível concluir: o registro está vinculado a outros dados.'
    ],
    ['22001', 400, 'Dados inválidos.'],
    ['22P02', 400, 'Dados inválidos.'],
    ['23502', 400, 'Dados inválidos.']
  ])(
    'traduz o erro %s do Postgres sem repassar a mensagem do banco',
    (code, statusCode, message) => {
      const response = toErrorResponse(postgresError(code))

      expect(response).toEqual({ statusCode, message })
      expect(JSON.stringify(response)).not.toMatch(
        /duplicate key|UQ_USERS|Key \(email\)/
      )
    }
  )

  it('trata erro desconhecido do banco como erro interno', () => {
    expect(toErrorResponse(postgresError('08006'))).toEqual({
      statusCode: 500,
      message: 'Erro interno. Tente novamente em instantes.'
    })
  })

  it('trata EntityNotFoundError do TypeORM como 404', () => {
    expect(toErrorResponse(new EntityNotFoundError('User', { id: 1 }))).toEqual(
      { statusCode: 404, message: 'Registro não encontrado.' }
    )
  })

  it('trata erro inesperado como 500 com mensagem genérica', () => {
    expect(
      toErrorResponse(
        new TypeError("Cannot read properties of undefined (reading 'id')")
      )
    ).toEqual({
      statusCode: 500,
      message: 'Erro interno. Tente novamente em instantes.'
    })
  })

  it('aceita erros 4xx do Express que podem ser expostos, com mensagem genérica', () => {
    const malformedJson = Object.assign(new SyntaxError('Unexpected token }'), {
      status: 400,
      expose: true
    })

    expect(toErrorResponse(malformedJson)).toEqual({
      statusCode: 400,
      message: 'Requisição inválida.'
    })
  })
})

class EchoDto {
  @IsString()
  readonly name: string
}

const failures = {
  unexpected: () => {
    throw new TypeError("Cannot read properties of undefined (reading 'id')")
  },
  duplicated: () => {
    throw postgresError('23505')
  }
}

@Controller('probe')
class ProbeController {
  @Get('unexpected')
  unexpected() {
    return failures.unexpected()
  }

  @Get('duplicated')
  duplicated() {
    return failures.duplicated()
  }

  @Get('number')
  number(@Query('value', ParseIntPipe) value: number) {
    return { value }
  }

  @Post('echo')
  echo(@Body() dto: EchoDto) {
    return dto
  }
}

describe('AllExceptionsFilter na aplicação', () => {
  let app: INestApplication
  let errorLog: ReturnType<typeof vi.spyOn>
  let warnLog: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
    warnLog = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController]
    }).compile()

    app = moduleRef.createNestApplication({ logger: false })
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => new CustomValidationException(errors)
      })
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    vi.restoreAllMocks()
  })

  it('quando o código quebra, responde 500 genérico e registra a stack com a rota', async () => {
    const response = await request(app.getHttpServer()).get('/probe/unexpected')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Erro interno. Tente novamente em instantes.'
    })
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('GET /probe/unexpected -> 500'),
      expect.stringContaining('TypeError')
    )
  })

  it('quando o banco recusa dado duplicado, responde 409 e registra a constraint só no log', async () => {
    const response = await request(app.getHttpServer()).get('/probe/duplicated')

    expect(response.status).toBe(409)
    expect(JSON.stringify(response.body)).not.toContain('UQ_USERS_EMAIL_ROLE')
    expect(warnLog).toHaveBeenCalledWith(
      expect.stringContaining('constraint UQ_USERS_EMAIL_ROLE')
    )
    expect(errorLog).not.toHaveBeenCalled()
  })

  it('quando a validação recusa o corpo, mantém o 422 com a mensagem da validação e não registra erro', async () => {
    const response = await request(app.getHttpServer())
      .post('/probe/echo')
      .send({ name: 42 })

    expect(response.status).toBe(422)
    expect(response.body).toEqual({
      statusCode: 422,
      message: 'name must be a string'
    })
    expect(errorLog).not.toHaveBeenCalled()
  })

  it('quando um pipe do Nest recusa o parâmetro, responde 400 com texto', async () => {
    const response = await request(app.getHttpServer()).get(
      '/probe/number?value=abc'
    )

    expect(response.status).toBe(400)
    expect(typeof response.body.message).toBe('string')
  })

  it('quando o JSON enviado é inválido, responde 400 no mesmo formato e sem registrar erro', async () => {
    const response = await request(app.getHttpServer())
      .post('/probe/echo')
      .set('content-type', 'application/json')
      .send('{"name": ')

    expect(response.status).toBe(400)
    expect(Object.keys(response.body).sort()).toEqual(['message', 'statusCode'])
    expect(errorLog).not.toHaveBeenCalled()
  })

  it('quando o corpo passa do limite, responde 413 com mensagem genérica', async () => {
    const response = await request(app.getHttpServer())
      .post('/probe/echo')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ name: 'x'.repeat(200_000) }))

    expect(response.status).toBe(413)
    expect(response.body).toEqual({
      statusCode: 413,
      message: 'Requisição inválida.'
    })
  })

  it('quando a rota não existe, responde 404 no mesmo formato', async () => {
    const response = await request(app.getHttpServer()).get('/probe/nada')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Cannot GET /probe/nada'
    })
  })
})
