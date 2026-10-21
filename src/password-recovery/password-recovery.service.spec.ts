import { BadRequestException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bcryptUtil from '@/common/utils/bcrypt.util'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { PasswordRecoveryService } from './password-recovery.service'

const EMAIL = 'usuario@ufba.br'
const NOW = new Date('2026-10-08T12:00:00Z')
const MINUTE = 60 * 1000
const messages = constants.exceptionMessages.passwordRecovery

type Mock = ReturnType<typeof vi.fn<(...args: any[]) => any>>

describe('PasswordRecoveryService', () => {
  let emailService: { sendEmail: Mock }
  let verificationCodeRepository: Record<
    | 'findLatestByAccount'
    | 'create'
    | 'deleteByAccount'
    | 'incrementAttempts'
    | 'markAsUsed',
    Mock
  >
  /** Uma busca por perfil, para cada teste controlar só a que interessa. */
  let accounts: Record<'STUDENT' | 'ADVISOR' | 'ADMIN' | 'ADVISOR_ADMIN', Mock>
  let userRepository: {
    findByEmail: Mock
    findAdvisorWithAdminPrivilegesByEmail: Mock
    updatePassword: Mock
  }
  let service: PasswordRecoveryService

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)

    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    verificationCodeRepository = {
      findLatestByAccount: vi.fn().mockResolvedValue(null),
      create: vi.fn(async (data: object) => ({ id: 1, ...data })),
      deleteByAccount: vi.fn().mockResolvedValue(undefined),
      incrementAttempts: vi.fn().mockResolvedValue(undefined),
      markAsUsed: vi.fn().mockResolvedValue(undefined)
    }
    accounts = {
      STUDENT: vi.fn().mockResolvedValue({ id: 10 }),
      ADVISOR: vi.fn().mockResolvedValue({ id: 20 }),
      ADMIN: vi.fn().mockResolvedValue({ id: 30 }),
      ADVISOR_ADMIN: vi.fn().mockResolvedValue(null)
    }
    const typed = async (found: Promise<object | null>, role: string) => {
      const user = await found
      return user && { ...user, role }
    }
    userRepository = {
      findByEmail: vi.fn(
        (email: string, type: 'STUDENT' | 'ADVISOR' | 'ADMIN') =>
          typed(accounts[type](email), type)
      ),
      findAdvisorWithAdminPrivilegesByEmail: vi.fn((email: string) =>
        typed(accounts.ADVISOR_ADMIN(email), 'ADVISOR')
      ),
      updatePassword: vi.fn().mockResolvedValue(undefined)
    }

    service = new PasswordRecoveryService(
      emailService as never,
      verificationCodeRepository as never,
      userRepository as never
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function request(role = 'STUDENT', extra: object = {}) {
    return { email: EMAIL, role, ...extra } as never
  }

  function sentEmail() {
    return emailService.sendEmail.mock.calls[0][0]
  }

  async function storedCode(code: string, overrides: object = {}) {
    return {
      id: 5,
      account_id: 10,
      account_table: 'STUDENT',
      code_hash: await hashPassword(code),
      expires_at: new Date(NOW.getTime() + 10 * MINUTE),
      attempts: 0,
      used_at: null,
      created_at: new Date(NOW.getTime() - 5 * MINUTE),
      ...overrides
    }
  }

  function passwordUpdates() {
    return userRepository.updatePassword.mock.calls
  }

  describe('sendCode', () => {
    it('envia um código de 6 dígitos e grava só o hash, válido por 15 minutos', async () => {
      await service.sendCode(request())

      const { to, template, context } = sentEmail()
      expect(to).toBe(EMAIL)
      expect(template).toBe('reset-password-code')
      expect(context.code).toMatch(/^\d{6}$/)
      expect(context.expiresInMinutes).toBe(15)

      const [saved] = verificationCodeRepository.create.mock.calls[0]
      expect(saved).toMatchObject({
        account_id: 10,
        account_table: 'STUDENT',
        expires_at: new Date(NOW.getTime() + 15 * MINUTE)
      })
      expect(saved.code_hash).not.toBe(context.code)
      await expect(
        comparePassword(context.code, saved.code_hash)
      ).resolves.toBe(true)
    })

    it('não gera nem grava senha nova na conta', async () => {
      await service.sendCode(request())

      expect(sentEmail().context).not.toHaveProperty('newPassword')
      expect(passwordUpdates()).toEqual([])
    })

    it('apaga o código pendente da conta antes de gravar o novo', async () => {
      await service.sendCode(request())

      expect(verificationCodeRepository.deleteByAccount).toHaveBeenCalledWith(
        'STUDENT',
        10
      )
      expect(
        verificationCodeRepository.deleteByAccount.mock.invocationCallOrder[0]
      ).toBeLessThan(
        verificationCodeRepository.create.mock.invocationCallOrder[0]
      )
    })

    it.each([
      ['STUDENT', false, 'STUDENT', 10],
      ['ADVISOR', false, 'ADVISOR', 20],
      ['ADVISOR_WITH_ADMIN_PRIVILEGES', true, 'ADVISOR', 21],
      ['ADMIN', true, 'ADVISOR', 21],
      ['ADMIN', false, 'ADMIN', 30]
    ])(
      'vincula o código à conta certa (%s, orientador admin: %s)',
      async (role, isAdvisorAdmin, table, id) => {
        accounts.ADVISOR_ADMIN.mockResolvedValue(
          isAdvisorAdmin ? { id: 21 } : null
        )

        await service.sendCode(request(role))

        expect(verificationCodeRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ account_table: table, account_id: id })
        )
      }
    )

    it.each([
      ['STUDENT', () => accounts.STUDENT],
      ['ADVISOR', () => accounts.ADVISOR],
      ['ADVISOR_WITH_ADMIN_PRIVILEGES', () => accounts.ADVISOR_ADMIN],
      ['ADMIN', () => accounts.ADMIN]
    ])(
      'quando a conta não existe, responde sem erro e sem enviar nada (%s)',
      async (role, lookup) => {
        lookup().mockResolvedValue(null)

        await expect(service.sendCode(request(role))).resolves.toBeUndefined()

        expect(emailService.sendEmail).not.toHaveBeenCalled()
        expect(verificationCodeRepository.create).not.toHaveBeenCalled()
      }
    )

    it('quando o último envio foi há menos de 1 minuto, responde igual sem reenviar', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456', {
          created_at: new Date(NOW.getTime() - 30 * 1000)
        })
      )

      await expect(service.sendCode(request())).resolves.toBeUndefined()

      expect(emailService.sendEmail).not.toHaveBeenCalled()
      expect(verificationCodeRepository.create).not.toHaveBeenCalled()
    })

    it('passado 1 minuto do último envio, gera outro código', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456', {
          created_at: new Date(NOW.getTime() - MINUTE)
        })
      )

      await service.sendCode(request())

      expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
      expect(verificationCodeRepository.create).toHaveBeenCalledTimes(1)
    })

    it('quando o e-mail falha, mantém o código anterior e propaga o erro', async () => {
      const failure = new Error('SMTP indisponível')
      emailService.sendEmail.mockRejectedValue(failure)

      await expect(service.sendCode(request())).rejects.toBe(failure)

      expect(verificationCodeRepository.deleteByAccount).not.toHaveBeenCalled()
      expect(verificationCodeRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('requestCode', () => {
    it('responde antes de procurar a conta e de enviar o e-mail', () => {
      let releaseLookup: (value: unknown) => void = () => undefined
      accounts.STUDENT.mockReturnValue(
        new Promise((resolve) => {
          releaseLookup = resolve
        })
      )

      expect(service.requestCode(request())).toBeUndefined()
      expect(emailService.sendEmail).not.toHaveBeenCalled()

      releaseLookup({ id: 10 })
    })

    it('quando o envio falha em segundo plano, registra o erro sem propagar', async () => {
      const send = vi
        .spyOn(service, 'sendCode')
        .mockRejectedValue(new Error('SMTP indisponível'))
      const logError = vi
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => undefined)

      expect(() => service.requestCode(request())).not.toThrow()
      await vi.waitFor(() => expect(logError).toHaveBeenCalledTimes(1))

      expect(send).toHaveBeenCalledWith(request())
      expect(logError.mock.calls[0][0]).toContain(EMAIL)
    })
  })

  describe('verifyCode', () => {
    it('com o código certo, aceita sem consumir o código', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456')
      )

      await expect(
        service.verifyCode(request('STUDENT', { code: '123456' }))
      ).resolves.toBeUndefined()

      expect(verificationCodeRepository.markAsUsed).not.toHaveBeenCalled()
      expect(
        verificationCodeRepository.incrementAttempts
      ).not.toHaveBeenCalled()
    })

    it('com o código errado, recusa e conta a tentativa', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456')
      )

      await expect(
        service.verifyCode(request('STUDENT', { code: '654321' }))
      ).rejects.toThrow(new BadRequestException(messages.INVALID_CODE))

      expect(verificationCodeRepository.incrementAttempts).toHaveBeenCalledWith(
        5
      )
    })

    it.each([
      ['expirado', { expires_at: NOW }],
      ['já utilizado', { used_at: new Date(NOW.getTime() - MINUTE) }]
    ])(
      'com código %s, recusa como código inválido mesmo que confira',
      async (_, overrides) => {
        verificationCodeRepository.findLatestByAccount.mockResolvedValue(
          await storedCode('123456', overrides)
        )

        await expect(
          service.verifyCode(request('STUDENT', { code: '123456' }))
        ).rejects.toThrow(new BadRequestException(messages.INVALID_CODE))
      }
    )

    it('depois de 5 tentativas erradas, recusa como código inválido até o código certo', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456', { attempts: 5 })
      )

      await expect(
        service.verifyCode(request('STUDENT', { code: '123456' }))
      ).rejects.toThrow(new BadRequestException(messages.INVALID_CODE))
      expect(
        verificationCodeRepository.incrementAttempts
      ).not.toHaveBeenCalled()
    })

    it('com conta inexistente, ainda compara o código para não responder mais rápido', async () => {
      const compare = vi.spyOn(bcryptUtil, 'comparePasswordOrDecoy')
      accounts.STUDENT.mockResolvedValue(null)

      await service
        .verifyCode(request('STUDENT', { code: '123456' }))
        .catch(() => undefined)

      expect(compare).toHaveBeenCalledWith('123456', null)
      compare.mockRestore()
    })

    it('sem código pendente, recusa como código inválido', async () => {
      await expect(
        service.verifyCode(request('STUDENT', { code: '123456' }))
      ).rejects.toThrow(new BadRequestException(messages.INVALID_CODE))
    })

    it('com conta inexistente, recusa como código inválido', async () => {
      accounts.STUDENT.mockResolvedValue(null)

      await expect(
        service.verifyCode(request('STUDENT', { code: '123456' }))
      ).rejects.toThrow(new BadRequestException(messages.INVALID_CODE))

      expect(
        verificationCodeRepository.findLatestByAccount
      ).not.toHaveBeenCalled()
    })
  })

  describe('confirmReset', () => {
    function confirmation(role: string, code = '123456') {
      return request(role, {
        code,
        new_password: 'nova1',
        confirm_new_password: 'nova1'
      })
    }

    it.each([
      ['STUDENT', false, 10],
      ['ADVISOR', false, 20],
      ['ADMIN', true, 21],
      ['ADMIN', false, 30]
    ])(
      'grava a nova senha hasheada na conta certa e consome o código (%s, orientador admin: %s)',
      async (role, isAdvisorAdmin, id) => {
        accounts.ADVISOR_ADMIN.mockResolvedValue(
          isAdvisorAdmin ? { id: 21 } : null
        )
        verificationCodeRepository.findLatestByAccount.mockResolvedValue(
          await storedCode('123456')
        )

        await service.confirmReset(confirmation(role))

        expect(passwordUpdates()).toHaveLength(1)
        const [accountId, hash] = passwordUpdates()[0]
        expect(accountId).toBe(id)
        await expect(comparePassword('nova1', hash)).resolves.toBe(true)
        expect(verificationCodeRepository.markAsUsed).toHaveBeenCalledWith(
          5,
          NOW
        )
      }
    )

    it('com código inválido, não altera a senha', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456')
      )

      await expect(
        service.confirmReset(confirmation('STUDENT', '000000'))
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(passwordUpdates()).toEqual([])
      expect(verificationCodeRepository.markAsUsed).not.toHaveBeenCalled()
    })
  })
})
