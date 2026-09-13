import { ExecutionContext } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnvironmentGuard } from './environment.guard'

describe('EnvironmentGuard', () => {
  let configService: { get: ReturnType<typeof vi.fn> }
  let guard: EnvironmentGuard

  const context = {} as ExecutionContext

  beforeEach(() => {
    configService = { get: vi.fn() }
    guard = new EnvironmentGuard(configService as never)
  })

  it('quando NODE_ENV é exatamente "production", bloqueia a rota', () => {
    configService.get.mockReturnValue('production')

    expect(guard.canActivate(context)).toBe(false)
  })

  it('quando decide o acesso, lê a chave NODE_ENV', () => {
    configService.get.mockReturnValue('production')

    guard.canActivate(context)

    expect(configService.get).toHaveBeenCalledWith('NODE_ENV')
  })

  it.each([['development'], ['test']])(
    'quando NODE_ENV é um ambiente reconhecido como não-produção, libera a rota (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(true)
    }
  )

  it.each([['DEVELOPMENT'], ['Development'], ['development '], [' test']])(
    'quando NODE_ENV difere só na caixa ou em espaço, libera a rota (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(true)
    }
  )

  it.each([['PRODUCTION'], ['Production'], ['production '], ['prod'], ['prd']])(
    'quando NODE_ENV é uma variação de produção, bloqueia a rota (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(false)
    }
  )

  it.each([['staging'], ['homolog'], ['qa'], ['local']])(
    'quando NODE_ENV é um ambiente desconhecido, bloqueia a rota (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(false)
    }
  )

  it.each([[undefined], [null], [''], ['   ']])(
    'quando NODE_ENV está ausente ou vazio, bloqueia a rota (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(false)
    }
  )
})
