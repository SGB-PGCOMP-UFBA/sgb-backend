import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdvisor } from '@/common/testing/factories'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { CreateAdvisorDto } from '@/advisor/dtos/create-advisor.dto'
import { UpdateAdvisorDto } from '@/advisor/dtos/update-advisor.dto'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { AdvisorService } from './advisor.service'

const CREATE_DTO: CreateAdvisorDto = {
  name: 'Beatriz Rocha',
  email: 'orientador@ufba.br',
  password: 'senha1',
  status: 'ACTIVE',
  tax_id: '12345678901',
  phone_number: '71999999999',
  notify: false
}

function createAdvisorRepositoryMock() {
  return {
    findAllWithEnrollments: vi.fn().mockResolvedValue([]),
    findAllForFilter: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByTaxId: vi.fn().mockResolvedValue(null),
    findByPhoneNumber: vi.fn().mockResolvedValue(null),
    findByEmailAndAdminPrivileges: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (data: unknown) => data),
    update: vi.fn(async (_id: number, data: unknown) => data),
    updatePasswordByEmail: vi.fn().mockResolvedValue(undefined),
    setAdminPrivileges: vi.fn().mockResolvedValue(undefined),
    deleteById: vi.fn().mockResolvedValue(1)
  } satisfies Record<keyof AdvisorRepository, unknown>
}

describe('AdvisorService', () => {
  let repository: ReturnType<typeof createAdvisorRepositoryMock>
  let emailService: { sendEmail: ReturnType<typeof vi.fn> }
  let service: AdvisorService

  beforeEach(() => {
    repository = createAdvisorRepositoryMock()
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    service = new AdvisorService(
      emailService as never,
      repository as unknown as AdvisorRepository
    )
  })

  describe('create', () => {
    it('quando um orientador é cadastrado, grava a senha hasheada e nunca em texto puro', async () => {
      await service.create(CREATE_DTO)

      const gravado = repository.create.mock.calls[0][0] as CreateAdvisorDto
      expect(gravado.password).not.toBe('senha1')
      await expect(comparePassword('senha1', gravado.password)).resolves.toBe(
        true
      )
    })

    it.each([[true, 1]])(
      'quando o cadastro pede notificação, envia o e-mail de boas-vindas (notify=%s)',
      async (notify, sent) => {
        await service.create({ ...CREATE_DTO, notify } as CreateAdvisorDto)

        expect(emailService.sendEmail).toHaveBeenCalledTimes(sent)
      }
    )

    it.each([
      [false, 0],
      [undefined, 0]
    ])(
      'quando o cadastro não pede notificação, não envia e-mail de boas-vindas (notify=%s)',
      async (notify, sent) => {
        await service.create({ ...CREATE_DTO, notify } as CreateAdvisorDto)

        expect(emailService.sendEmail).toHaveBeenCalledTimes(sent)
      }
    )

    it('quando o cadastro pede notificação, envia a senha provisória só no e-mail e não a grava em texto puro', async () => {
      await service.create({ ...CREATE_DTO, notify: true })

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'orientador@ufba.br',
          template: 'welcome-advisor',
          context: { newPassword: 'senha1' }
        })
      )
      const gravado = repository.create.mock.calls[0][0] as CreateAdvisorDto
      expect(gravado.password).not.toBe('senha1')
    })

    it('quando a gravação falha, recusa o cadastro', async () => {
      repository.create.mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      )

      const error = await service.create(CREATE_DTO).catch((e) => e)

      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.message).toBe(
        constants.exceptionMessages.advisor.CREATION_FAILED
      )
    })
  })

  describe('buscas por identificador', () => {
    it.each([
      ['findOneById', 'findById', 9],
      ['findOneByEmail', 'findByEmail', 'orientador@ufba.br'],
      ['findOneByTaxId', 'findByTaxId', '12345678901']
    ] as const)(
      'quando não há orientador correspondente, lança NotFound (%s)',
      async (method, _repositoryMethod, args) => {
        await expect(
          (service[method] as (v: unknown) => Promise<Advisor>)(args)
        ).rejects.toBeInstanceOf(NotFoundException)
      }
    )

    it.each([
      ['findOneById', 'findById', 9],
      ['findOneByEmail', 'findByEmail', 'orientador@ufba.br'],
      ['findOneByTaxId', 'findByTaxId', '12345678901']
    ] as const)(
      'quando o orientador existe, retorna-o buscando pelo método esperado (%s)',
      async (method, repositoryMethod, args) => {
        const advisor = makeAdvisor()
        repository[repositoryMethod].mockResolvedValue(advisor)

        await expect(
          (service[method] as (v: unknown) => Promise<Advisor>)(args)
        ).resolves.toBe(advisor)
        expect(repository[repositoryMethod]).toHaveBeenCalledWith(args)
      }
    )
  })

  describe('update', () => {
    const actual = makeAdvisor({
      id: 9,
      name: 'Beatriz Rocha',
      email: 'orientador@ufba.br'
    })

    beforeEach(() => {
      repository.findByEmail.mockResolvedValue(actual)
    })

    it('quando o CPF já está em uso por outro orientador, recusa a alteração', async () => {
      repository.findByTaxId.mockResolvedValue(makeAdvisor({ id: 99 }))

      const erro = await service
        .update({
          current_email: 'orientador@ufba.br',
          tax_id: '99999999999'
        } as UpdateAdvisorDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando o e-mail já está em uso por outro orientador, recusa a alteração', async () => {
      repository.findByEmail
        .mockResolvedValueOnce(actual)
        .mockResolvedValue(makeAdvisor({ id: 99 }))

      const erro = await service
        .update({
          current_email: 'orientador@ufba.br',
          email: 'outro@ufba.br'
        } as UpdateAdvisorDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando o telefone já está em uso por outro orientador, recusa a alteração', async () => {
      repository.findByPhoneNumber.mockResolvedValue(makeAdvisor({ id: 99 }))

      const erro = await service
        .update({
          current_email: 'orientador@ufba.br',
          phone_number: '71888888888'
        } as UpdateAdvisorDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando o dto não informa nome, e-mail e situação, mantém os valores atuais', async () => {
      await service.update({
        current_email: 'orientador@ufba.br'
      } as UpdateAdvisorDto)

      expect(repository.update).toHaveBeenCalledWith(
        9,
        expect.objectContaining({
          name: 'Beatriz Rocha',
          email: 'orientador@ufba.br',
          status: 'ACTIVE'
        })
      )
    })

    it('quando o dto pede a situação INACTIVE, inativa o orientador', async () => {
      await service.update({
        current_email: 'orientador@ufba.br',
        status: 'INACTIVE'
      } as UpdateAdvisorDto)

      expect(repository.update).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ status: 'INACTIVE' })
      )
    })

    it('quando o current_email não existe, lança NotFound', async () => {
      repository.findByEmail.mockResolvedValue(null)

      await expect(
        service.update({ current_email: 'sumiu@ufba.br' } as UpdateAdvisorDto)
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando a gravação falha, converte em erro de atualização', async () => {
      repository.update.mockRejectedValue(new Error('connection terminated'))

      const erro = await service
        .update({ current_email: 'orientador@ufba.br' } as UpdateAdvisorDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.exceptionMessages.advisor.UPDATE_FAILED
      )
    })
  })

  describe('updatePassword', () => {
    it('quando a senha atual não confere, recusa a troca', async () => {
      repository.findByEmail.mockResolvedValue(
        makeAdvisor({ password: await hashPassword('senha1') })
      )

      const erro = await service
        .updatePassword('orientador@ufba.br', 'senha-errada', 'nova1')
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
      expect(repository.updatePasswordByEmail).not.toHaveBeenCalled()
    })

    it('quando a senha atual confere, troca a senha', async () => {
      repository.findByEmail.mockResolvedValue(
        makeAdvisor({ password: await hashPassword('senha1') })
      )

      await service.updatePassword('orientador@ufba.br', 'senha1', 'nova1')

      const [email, hash] = repository.updatePasswordByEmail.mock.calls[0]
      expect(email).toBe('orientador@ufba.br')
      await expect(comparePassword('nova1', hash)).resolves.toBe(true)
    })

    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      repository.findByEmail.mockResolvedValue(null)

      await expect(
        service.updatePassword('sumiu@ufba.br', 'senha1', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('resetPassword', () => {
    it.each([
      [undefined, false],
      [false, false],
      [true, true]
    ])(
      'procura o orientador pelo privilégio de admin pedido (%s → %s)',
      async (informado, esperado) => {
        repository.findByEmailAndAdminPrivileges.mockResolvedValue(
          makeAdvisor()
        )

        await service.resetPassword(
          'orientador@ufba.br',
          'nova1',
          informado as boolean
        )

        expect(repository.findByEmailAndAdminPrivileges).toHaveBeenCalledWith(
          'orientador@ufba.br',
          esperado
        )
      }
    )

    it('quando a senha é redefinida, grava a nova senha hasheada', async () => {
      repository.findByEmailAndAdminPrivileges.mockResolvedValue(makeAdvisor())

      await service.resetPassword('orientador@ufba.br', 'nova1')

      const [, hash] = repository.updatePasswordByEmail.mock.calls[0]
      expect(hash).not.toBe('nova1')
      await expect(comparePassword('nova1', hash)).resolves.toBe(true)
    })

    it('quando não encontra o orientador, lança NotFound e não altera nada', async () => {
      repository.findByEmailAndAdminPrivileges.mockResolvedValue(null)

      await expect(
        service.resetPassword('sumiu@ufba.br', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(repository.updatePasswordByEmail).not.toHaveBeenCalled()
    })
  })

  describe('grantAdminPrivileges', () => {
    it.each([
      [false, true],
      [true, false]
    ])(
      'quando o método é chamado, alterna o privilégio de administrador em vez de concedê-lo (%s → %s)',
      async (atual, esperado) => {
        repository.findById.mockResolvedValue(
          makeAdvisor({ has_admin_privileges: atual })
        )

        await service.grantAdminPrivileges(9)

        expect(repository.setAdminPrivileges).toHaveBeenCalledWith(9, esperado)
      }
    )

    it('quando o orientador não existe, lança NotFound e não altera nada', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.grantAdminPrivileges(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
      expect(repository.setAdminPrivileges).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('quando uma linha foi apagada, confirma a remoção', async () => {
      repository.deleteById.mockResolvedValue(1)

      await expect(service.delete(9)).resolves.toBe(true)
    })

    it('quando nenhuma linha foi apagada, lança NotFound', async () => {
      repository.deleteById.mockResolvedValue(0)

      await expect(service.delete(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('findAll', () => {
    it('quando a listagem é pedida, carrega as orientações', async () => {
      await service.findAll()

      expect(repository.findAllWithEnrollments).toHaveBeenCalled()
    })

    it('quando a listagem é para filtro, não carrega as orientações', async () => {
      await service.findAllForFilter()

      expect(repository.findAllForFilter).toHaveBeenCalled()
      expect(repository.findAllWithEnrollments).not.toHaveBeenCalled()
    })
  })
})
