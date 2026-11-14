import { createHash } from 'node:crypto'
import { HttpStatus, UnauthorizedException } from '@nestjs/common'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import { makeAdvisor, makeStudent } from '@/common/testing/factories'
import * as bcryptUtil from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { AuthService } from './auth.service'

const PLAIN_PASSWORD = 'Senha@123'
const INVALID_CREDENTIALS = new UnauthorizedException(
  constants.exceptionMessages.auth.INVALID_CREDENTIALS
)
const SESSION_EXPIRED = new UnauthorizedException(
  constants.exceptionMessages.auth.SESSION_EXPIRED
)
const NOW = new Date('2026-05-10T12:00:00.000Z')
const SECOND = 1000

type Mock = ReturnType<typeof vi.fn<(...args: any[]) => any>>

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

const USER = makeStudent({
  id: 10,
  tax_id: '123.456.789-00',
  name: 'Maria Souza',
  email: 'maria@ufba.br',
  password: '',
  link_to_lattes: 'http://lattes.cnpq.br/1',
  has_admin_privileges: true
})

describe('AuthService', () => {
  let userService: { findUserByEmailAndRole: ReturnType<typeof vi.fn> }
  let jwtService: { sign: Mock }
  let userRepository: { findById: Mock }
  let refreshTokenRepository: Record<
    'findById' | 'create' | 'revoke' | 'revokeAllByUser',
    Mock
  >
  let service: AuthService

  beforeAll(async () => {
    USER.password = await bcryptUtil.hashPassword(PLAIN_PASSWORD)
  })

  beforeEach(() => {
    userService = { findUserByEmailAndRole: vi.fn().mockResolvedValue(USER) }
    jwtService = {
      sign: vi.fn((payload: { type: string }) => `${payload.type}-assinado`)
    }
    userRepository = { findById: vi.fn().mockResolvedValue(USER) }
    refreshTokenRepository = {
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(async (data: object) => data),
      revoke: vi.fn().mockResolvedValue(true),
      revokeAllByUser: vi.fn().mockResolvedValue(undefined)
    }
    service = new AuthService(
      userService as never,
      jwtService as never,
      userRepository as never,
      refreshTokenRepository as never
    )
  })

  describe('validateUser', () => {
    it('quando e-mail, cargo e senha conferem, autentica o usuário', async () => {
      const result = await service.validateUser(
        USER.email,
        PLAIN_PASSWORD,
        USER.role
      )

      expect(result).toMatchObject({
        id: USER.id,
        tax_id: USER.tax_id,
        name: USER.name,
        role: USER.role,
        email: USER.email,
        phone_number: USER.phone_number
      })
    })

    it('quando o usuário é autenticado, não devolve a senha nem campos fora do DTO de resposta', async () => {
      const result = await service.validateUser(
        USER.email,
        PLAIN_PASSWORD,
        USER.role
      )

      expect(Object.keys(result).sort()).toEqual([
        'email',
        'id',
        'name',
        'phone_number',
        'role',
        'tax_id'
      ])
    })

    it('quando valida o usuário, procura pelo par e-mail e cargo', async () => {
      await service.validateUser(USER.email, PLAIN_PASSWORD, USER.role)

      expect(userService.findUserByEmailAndRole).toHaveBeenCalledWith(
        USER.email,
        USER.role
      )
    })

    it('quando não existe usuário com aquele e-mail e cargo, rejeita com 401 genérico', async () => {
      userService.findUserByEmailAndRole.mockResolvedValue(null)

      await expect(
        service.validateUser(USER.email, PLAIN_PASSWORD, 'ADMIN')
      ).rejects.toThrow(INVALID_CREDENTIALS)
    })

    it.each([['senha-errada'], [''], ['senha@123'], ['Senha@1234']])(
      'quando a senha não confere, rejeita com 401 genérico (%s)',
      async (wrongPassword) => {
        const promise = service.validateUser(
          USER.email,
          wrongPassword,
          USER.role
        )

        await expect(promise).rejects.toThrow(INVALID_CREDENTIALS)
        await expect(promise).rejects.toMatchObject({
          status: HttpStatus.UNAUTHORIZED
        })
      }
    )

    it('quando o usuário não existe ou a senha erra, responde exatamente igual', async () => {
      userService.findUserByEmailAndRole.mockResolvedValue(null)
      const unknownUser = await service
        .validateUser('naoexiste@ufba.br', PLAIN_PASSWORD, USER.role)
        .catch((error) => error)

      userService.findUserByEmailAndRole.mockResolvedValue(USER)
      const wrongPassword = await service
        .validateUser(USER.email, 'errada', USER.role)
        .catch((error) => error)

      expect(unknownUser.getStatus()).toBe(wrongPassword.getStatus())
      expect(unknownUser.getResponse()).toEqual(wrongPassword.getResponse())
    })

    it('quando o usuário não existe, ainda compara a senha para não responder mais rápido', async () => {
      const compare = vi.spyOn(bcryptUtil, 'comparePasswordOrDecoy')
      userService.findUserByEmailAndRole.mockResolvedValue(null)

      await service
        .validateUser('naoexiste@ufba.br', PLAIN_PASSWORD, USER.role)
        .catch(() => undefined)

      expect(compare).toHaveBeenCalledWith(PLAIN_PASSWORD, undefined)
      compare.mockRestore()
    })
  })

  describe('login', () => {
    const LOGGED_USER = {
      id: 10,
      tax_id: '123.456.789-00',
      name: 'Maria Souza',
      role: 'STUDENT',
      email: 'maria@ufba.br',
      phone_number: '71999999999'
    } as never

    it('quando o usuário faz login, assina o token com cargo, nome e o par id-cargo como "sub"', async () => {
      await service.login(LOGGED_USER)

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'STUDENT',
          username: 'Maria Souza',
          sub: '10-STUDENT'
        })
      )
    })

    it('quando o cargo do usuário é ADVISOR, inclui o cargo no "sub" para desambiguar ids repetidos entre tabelas', async () => {
      await service.login({
        ...(LOGGED_USER as object),
        role: 'ADVISOR'
      } as never)

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: '10-ADVISOR' })
      )
    })

    it('quando o token é assinado, carimba o instante da autenticação em ISO 8601', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-10T12:00:00.000Z'))

      await service.login(LOGGED_USER)

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          authenticated_at: '2026-05-10T12:00:00.000Z'
        })
      )
      vi.useRealTimers()
    })

    it('quando o login termina, devolve os dois tokens junto dos dados de exibição do usuário', async () => {
      const result = await service.login(LOGGED_USER)

      expect(result).toEqual({
        access_token: 'access-assinado',
        refresh_token: 'refresh-assinado',
        id: 10,
        role: 'STUDENT',
        tax_id: '123.456.789-00',
        name: 'Maria Souza',
        email: 'maria@ufba.br',
        phone_number: '71999999999'
      })
    })

    it('quando o login termina, não devolve senha no payload nem na resposta', async () => {
      const result = await service.login(LOGGED_USER)

      expect(result).not.toHaveProperty('password')
      expect(jwtService.sign.mock.calls[0][0]).not.toHaveProperty('password')
    })
  })
})

describe('AuthService (refresh token)', () => {
  const ADVISOR_ADMIN = makeAdvisor({
    id: 21,
    name: 'Rui Lima',
    has_admin_privileges: true
  })
  const STUDENT = makeStudent({ id: 10, name: 'Maria Souza' })
  const TOKEN = 'refresh-token-recebido'

  let jwtService: { sign: Mock }
  let userRepository: { findById: Mock }
  let refreshTokenRepository: Record<
    'findById' | 'create' | 'revoke' | 'revokeAllByUser',
    Mock
  >
  let service: AuthService

  function payload(overrides: object = {}) {
    return {
      type: 'refresh',
      sub: '10-STUDENT',
      role: 'STUDENT',
      authenticated_at: '2026-05-01T08:00:00.000Z',
      jti: 'token-1',
      ...overrides
    } as never
  }

  function stored(overrides: object = {}) {
    return {
      id: 'token-1',
      user_id: 10,
      token_hash: sha256(TOKEN),
      expires_at: new Date(NOW.getTime() + 60 * 60 * SECOND),
      revoked_at: null,
      replaced_by_id: null,
      ...overrides
    }
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)

    jwtService = {
      sign: vi.fn((payload: { type: string }) => `${payload.type}-novo`)
    }
    userRepository = { findById: vi.fn().mockResolvedValue(STUDENT) }
    refreshTokenRepository = {
      findById: vi.fn().mockResolvedValue(stored()),
      create: vi.fn(async (data: object) => data),
      revoke: vi.fn().mockResolvedValue(true),
      revokeAllByUser: vi.fn().mockResolvedValue(undefined)
    }
    service = new AuthService(
      {} as never,
      jwtService as never,
      userRepository as never,
      refreshTokenRepository as never
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('login', () => {
    const LOGGED_USER = {
      id: 10,
      role: 'STUDENT',
      name: 'Maria Souza'
    } as never

    it('quando o login termina, guarda só o hash do refresh token, com a validade configurada', async () => {
      await service.login(LOGGED_USER)

      const [saved] = refreshTokenRepository.create.mock.calls[0]
      expect(saved).toMatchObject({
        user_id: 10,
        token_hash: sha256('refresh-novo'),
        expires_at: new Date(
          NOW.getTime() + constants.jwt.REFRESH_EXPIRATION_TIME * SECOND
        )
      })
      expect(JSON.stringify(saved)).not.toContain('refresh-novo')
    })

    it('quando assina o refresh token, usa o segredo próprio e o id da linha como jti', async () => {
      await service.login(LOGGED_USER)

      const [saved] = refreshTokenRepository.create.mock.calls[0]
      const refreshCall = jwtService.sign.mock.calls.find(
        ([signed]) => signed.type === 'refresh'
      )
      expect(refreshCall[0]).toMatchObject({
        sub: '10-STUDENT',
        role: 'STUDENT'
      })
      expect(refreshCall[1]).toEqual({
        secret: constants.jwt.REFRESH_SECRET_KEY,
        expiresIn: constants.jwt.REFRESH_EXPIRATION_TIME,
        jwtid: saved.id
      })
      expect(constants.jwt.REFRESH_SECRET_KEY).not.toBe(
        constants.jwt.SECRET_KEY
      )
    })

    it('quando assina o access token, marca o tipo para ele não valer como refresh', async () => {
      await service.login(LOGGED_USER)

      const accessCall = jwtService.sign.mock.calls.find(
        ([signed]) => signed.type === 'access'
      )
      expect(accessCall).toHaveLength(1)
    })
  })

  describe('validateRefreshToken', () => {
    it('quando o token está guardado, ativo e o usuário segue igual, devolve a sessão', async () => {
      const session = await service.validateRefreshToken(TOKEN, payload())

      expect(session).toEqual({
        user: expect.objectContaining({ id: 10, role: 'STUDENT' }),
        tokenId: 'token-1',
        authenticatedAt: '2026-05-01T08:00:00.000Z'
      })
    })

    it.each([
      ['o tipo não é refresh', payload({ type: 'access' }), stored()],
      ['o token não está guardado', payload(), null],
      [
        'o hash não confere',
        payload(),
        stored({ token_hash: sha256('outro') })
      ],
      [
        'a linha já expirou',
        payload(),
        stored({ expires_at: new Date(NOW.getTime() - SECOND) })
      ],
      [
        'o token foi revogado no logout',
        payload(),
        stored({ revoked_at: new Date(NOW.getTime() - 60 * SECOND) })
      ]
    ])('quando %s, recusa com 401', async (_, received, row) => {
      refreshTokenRepository.findById.mockResolvedValue(row)

      await expect(
        service.validateRefreshToken(TOKEN, received)
      ).rejects.toThrow(SESSION_EXPIRED)
      expect(refreshTokenRepository.revokeAllByUser).not.toHaveBeenCalled()
    })

    it('quando um token já trocado volta depois da janela de corrida, revoga todas as sessões do usuário', async () => {
      refreshTokenRepository.findById.mockResolvedValue(
        stored({
          revoked_at: new Date(NOW.getTime() - 5 * 60 * SECOND),
          replaced_by_id: 'token-2'
        })
      )

      await expect(
        service.validateRefreshToken(TOKEN, payload())
      ).rejects.toThrow(SESSION_EXPIRED)
      expect(refreshTokenRepository.revokeAllByUser).toHaveBeenCalledWith(
        10,
        NOW
      )
    })

    it('quando um token já trocado volta segundos depois (duas abas renovando), recusa sem derrubar as outras sessões', async () => {
      refreshTokenRepository.findById.mockResolvedValue(
        stored({
          revoked_at: new Date(NOW.getTime() - 2 * SECOND),
          replaced_by_id: 'token-2'
        })
      )

      await expect(
        service.validateRefreshToken(TOKEN, payload())
      ).rejects.toThrow(SESSION_EXPIRED)
      expect(refreshTokenRepository.revokeAllByUser).not.toHaveBeenCalled()
    })

    it('quando o usuário foi apagado, recusa com 401', async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(
        service.validateRefreshToken(TOKEN, payload())
      ).rejects.toThrow(SESSION_EXPIRED)
    })

    it('quando o cargo do usuário mudou, recusa com 401', async () => {
      userRepository.findById.mockResolvedValue(
        makeAdvisor({ id: 10, has_admin_privileges: false })
      )

      await expect(
        service.validateRefreshToken(TOKEN, payload())
      ).rejects.toThrow(SESSION_EXPIRED)
    })

    it('quando o orientador entrou como administrador e ainda tem o privilégio, mantém o cargo do login', async () => {
      userRepository.findById.mockResolvedValue(ADVISOR_ADMIN)
      refreshTokenRepository.findById.mockResolvedValue(stored({ user_id: 21 }))

      const session = await service.validateRefreshToken(
        TOKEN,
        payload({
          sub: '21-ADVISOR_WITH_ADMIN_PRIVILEGES',
          role: 'ADVISOR_WITH_ADMIN_PRIVILEGES'
        })
      )

      expect(session.user.role).toBe('ADVISOR_WITH_ADMIN_PRIVILEGES')
    })

    it('quando o orientador perdeu o privilégio de administrador, recusa a sessão de administrador', async () => {
      userRepository.findById.mockResolvedValue(
        makeAdvisor({ id: 21, has_admin_privileges: false })
      )
      refreshTokenRepository.findById.mockResolvedValue(stored({ user_id: 21 }))

      await expect(
        service.validateRefreshToken(
          TOKEN,
          payload({ role: 'ADVISOR_WITH_ADMIN_PRIVILEGES' })
        )
      ).rejects.toThrow(SESSION_EXPIRED)
    })
  })

  describe('refresh', () => {
    const SESSION = {
      user: { id: 10, role: 'STUDENT', name: 'Maria Souza' },
      tokenId: 'token-1',
      authenticatedAt: '2026-05-01T08:00:00.000Z'
    } as never

    it('quando renova, revoga o token usado apontando para o novo e devolve um par novo', async () => {
      const tokens = await service.refresh(SESSION)

      const [saved] = refreshTokenRepository.create.mock.calls[0]
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(
        'token-1',
        NOW,
        saved.id
      )
      expect(tokens).toEqual({
        access_token: 'access-novo',
        refresh_token: 'refresh-novo'
      })
    })

    it('quando renova, mantém o instante do login original nos tokens novos', async () => {
      await service.refresh(SESSION)

      for (const [signed] of jwtService.sign.mock.calls) {
        expect(signed.authenticated_at).toBe('2026-05-01T08:00:00.000Z')
      }
    })

    it('quando outro pedido já trocou o mesmo token, recusa sem emitir par novo', async () => {
      refreshTokenRepository.revoke.mockResolvedValue(false)

      await expect(service.refresh(SESSION)).rejects.toThrow(SESSION_EXPIRED)
      expect(refreshTokenRepository.create).not.toHaveBeenCalled()
      expect(jwtService.sign).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('quando sai, revoga só o refresh token daquela sessão', async () => {
      await service.logout({ tokenId: 'token-1' } as never)

      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('token-1', NOW)
      expect(refreshTokenRepository.revokeAllByUser).not.toHaveBeenCalled()
    })
  })
})
