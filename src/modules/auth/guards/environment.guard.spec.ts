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

  it('quando NODE_ENV é "development", libera a rota', () => {
    configService.get.mockReturnValue('development')

    expect(guard.canActivate(context)).toBe(true)
  })

  it.each([['PRODUCTION'], ['Production'], ['production '], ['prod'], ['prd']])(
    'quando NODE_ENV não é exatamente "production", libera a rota protegida — falha em modo aberto (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(true)
    }
  )

  it.each([[undefined], [null], ['']])(
    'quando NODE_ENV está ausente ou vazio, libera a rota protegida — falha em modo aberto (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(true)
    }
  )
})
