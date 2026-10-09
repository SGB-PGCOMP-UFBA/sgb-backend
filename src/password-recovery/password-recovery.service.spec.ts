import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { PasswordRecoveryService } from './password-recovery.service'

const EMAIL = 'usuario@ufba.br'
const NOW = new Date('2026-10-08T12:00:00Z')
const MINUTE = 60 * 1000
const messages = constants.exceptionMessages.passwordRecovery

type Mock = ReturnType<typeof vi.fn>

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
  let studentRepository: { findByEmail: Mock; updatePasswordById: Mock }
  let advisorRepository: {
    findByEmail: Mock
    findByEmailAndAdminPrivileges: Mock
    updatePasswordById: Mock
  }
  let adminRepository: { findByEmail: Mock; updatePasswordById: Mock }
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
    studentRepository = {
      findByEmail: vi.fn().mockResolvedValue({ id: 10 }),
      updatePasswordById: vi.fn().mockResolvedValue(undefined)
    }
    advisorRepository = {
      findByEmail: vi.fn().mockResolvedValue({ id: 20 }),
      findByEmailAndAdminPrivileges: vi.fn().mockResolvedValue(null),
      updatePasswordById: vi.fn().mockResolvedValue(undefined)
    }
    adminRepository = {
      findByEmail: vi.fn().mockResolvedValue({ id: 30 }),
      updatePasswordById: vi.fn().mockResolvedValue(undefined)
    }

    service = new PasswordRecoveryService(
      emailService as never,
      verificationCodeRepository as never,
      studentRepository as never,
      advisorRepository as never,
      adminRepository as never
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
    return [studentRepository, advisorRepository, adminRepository].flatMap(
      (repository) => repository.updatePasswordById.mock.calls
    )
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
        advisorRepository.findByEmailAndAdminPrivileges.mockResolvedValue(
          isAdvisorAdmin ? { id: 21 } : null
        )

        await service.sendCode(request(role))

        expect(verificationCodeRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ account_table: table, account_id: id })
        )
      }
    )

    it.each([
      ['STUDENT', () => studentRepository.findByEmail],
      ['ADVISOR', () => advisorRepository.findByEmail],
      [
        'ADVISOR_WITH_ADMIN_PRIVILEGES',
        () => advisorRepository.findByEmailAndAdminPrivileges
      ],
      ['ADMIN', () => adminRepository.findByEmail]
    ])(
      'quando a conta não existe, responde sem erro e sem enviar nada (%s)',
      async (role, lookup) => {
        lookup().mockResolvedValue(null)

        await expect(service.sendCode(request(role))).resolves.toBeUndefined()

        expect(emailService.sendEmail).not.toHaveBeenCalled()
        expect(verificationCodeRepository.create).not.toHaveBeenCalled()
      }
    )

    it('quando o último envio foi há menos de 1 minuto, recusa com 429', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456', {
          created_at: new Date(NOW.getTime() - 30 * 1000)
        })
      )

      const error = await service.sendCode(request()).catch((e) => e)

      expect(error).toBeInstanceOf(HttpException)
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS)
      expect(error.message).toBe(messages.RESEND_TOO_SOON)
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
    ])('com código %s, recusa mesmo que confira', async (_, overrides) => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456', overrides)
      )

      await expect(
        service.verifyCode(request('STUDENT', { code: '123456' }))
      ).rejects.toThrow(new BadRequestException(messages.EXPIRED_CODE))
    })

    it('depois de 5 tentativas erradas, recusa até o código certo', async () => {
      verificationCodeRepository.findLatestByAccount.mockResolvedValue(
        await storedCode('123456', { attempts: 5 })
      )

      await expect(
        service.verifyCode(request('STUDENT', { code: '123456' }))
      ).rejects.toThrow(new BadRequestException(messages.TOO_MANY_ATTEMPTS))
    })

    it('sem código pendente, recusa como código inválido', async () => {
      await expect(
        service.verifyCode(request('STUDENT', { code: '123456' }))
      ).rejects.toThrow(new BadRequestException(messages.INVALID_CODE))
    })

    it('com conta inexistente, recusa como código inválido', async () => {
      studentRepository.findByEmail.mockResolvedValue(null)

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
      ['STUDENT', false, () => studentRepository, 10],
      ['ADVISOR', false, () => advisorRepository, 20],
      ['ADMIN', true, () => advisorRepository, 21],
      ['ADMIN', false, () => adminRepository, 30]
    ])(
      'grava a nova senha hasheada na conta certa e consome o código (%s, orientador admin: %s)',
      async (role, isAdvisorAdmin, target, id) => {
        advisorRepository.findByEmailAndAdminPrivileges.mockResolvedValue(
          isAdvisorAdmin ? { id: 21 } : null
        )
        verificationCodeRepository.findLatestByAccount.mockResolvedValue(
          await storedCode('123456')
        )

        await service.confirmReset(confirmation(role))

        expect(passwordUpdates()).toHaveLength(1)
        const [accountId, hash] = target().updatePasswordById.mock.calls[0]
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
