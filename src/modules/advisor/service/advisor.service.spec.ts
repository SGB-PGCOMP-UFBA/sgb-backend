import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdvisor } from '@/core/testing/factories'
import { createRepositoryMock } from '@/core/testing/repository.mock'
import { comparePassword, hashPassword } from '@/core/utils/bcrypt'
import { constants } from '@/core/utils/constants'
import { CreateAdvisorDto } from '@/modules/advisor/dto/create-advisor.dto'
import { UpdateAdvisorDto } from '@/modules/advisor/dto/update-advisor.dto'
import { Advisor } from '@/modules/advisor/entities/advisor.entity'
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

describe('AdvisorService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let emailService: { sendEmail: ReturnType<typeof vi.fn> }
  let service: AdvisorService

  beforeEach(() => {
    repository = createRepositoryMock({
      update: vi.fn().mockResolvedValue({ affected: 1 })
    })
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    service = new AdvisorService(emailService as never, repository)
  })

  describe('create', () => {
    it('quando um orientador é cadastrado, grava a senha hasheada e nunca em texto puro', async () => {
      await service.create(CREATE_DTO)

      const gravado = repository.create.mock.calls[0][0]
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
      expect(repository.create.mock.calls[0][0].password).not.toBe('senha1')
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
      ['findOneById', 9],
      ['findOneByEmail', 'orientador@ufba.br'],
      ['findOneByTaxId', '12345678901']
    ] as const)(
      'quando não há orientador correspondente, lança NotFound (%s)',
      async (method, args) => {
        repository.findOneBy.mockResolvedValue(null)

        await expect(
          (service[method] as (v: unknown) => Promise<Advisor>)(args)
        ).rejects.toBeInstanceOf(NotFoundException)
      }
    )

    it.each([
      ['findOneById', 9, { id: 9 }],
      ['findOneByEmail', 'orientador@ufba.br', { email: 'orientador@ufba.br' }],
      ['findOneByTaxId', '12345678901', { tax_id: '12345678901' }]
    ] as const)(
      'quando o orientador existe, retorna-o buscando pelo critério esperado (%s)',
      async (method, args, discretion) => {
        const advisor = makeAdvisor()
        repository.findOneBy.mockResolvedValue(advisor)

        await expect(
          (service[method] as (v: unknown) => Promise<Advisor>)(args)
        ).resolves.toBe(advisor)
        expect(repository.findOneBy).toHaveBeenCalledWith(discretion)
      }
    )
  })

  describe('update', () => {
    const actual = makeAdvisor({
      id: 9,
      name: 'Beatriz Rocha',
      email: 'orientador@ufba.br'
    })

    it.each([
      [
        'CPF',
        { tax_id: '99999999999' },
        constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
      ],
      [
        'e-mail',
        { email: 'outro@ufba.br' },
        constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
      ],
      [
        'telefone',
        { phone_number: '71888888888' },
        constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
      ]
    ])(
      'quando o valor já está em uso por outro orientador, recusa a alteração (%s)',
      async (_, change, message) => {
        repository.findOneBy
          .mockResolvedValueOnce(actual)
          .mockResolvedValue(makeAdvisor({ id: 99 }))

        const erro = await service
          .update({
            current_email: 'orientador@ufba.br',
            ...change
          } as UpdateAdvisorDto)
          .catch((e) => e)

        expect(erro).toBeInstanceOf(BadRequestException)
        expect(erro.message).toBe(message)
        expect(repository.save).not.toHaveBeenCalled()
      }
    )

    it('quando o dto não informa nome, e-mail e situação, mantém os valores atuais', async () => {
      repository.findOneBy.mockResolvedValue(actual)

      await service.update({
        current_email: 'orientador@ufba.br'
      } as UpdateAdvisorDto)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 9,
          name: 'Beatriz Rocha',
          email: 'orientador@ufba.br',
          status: 'ACTIVE'
        })
      )
    })

    it('quando o dto pede a situação INACTIVE, inativa o orientador', async () => {
      repository.findOneBy.mockResolvedValue(actual)

      await service.update({
        current_email: 'orientador@ufba.br',
        status: 'INACTIVE'
      } as UpdateAdvisorDto)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'INACTIVE' })
      )
    })

    it('quando o current_email não existe, lança NotFound', async () => {
      repository.findOneBy.mockResolvedValue(null)

      await expect(
        service.update({ current_email: 'sumiu@ufba.br' } as UpdateAdvisorDto)
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando a gravação falha, converte em erro de atualização', async () => {
      repository.findOneBy.mockResolvedValue(actual)
      repository.save.mockRejectedValue(new Error('connection terminated'))

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
      repository.findOne.mockResolvedValue(
        makeAdvisor({ password: await hashPassword('senha1') })
      )

      const erro = await service
        .updatePassword('orientador@ufba.br', 'senha-errada', 'nova1')
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a senha atual confere, troca a senha', async () => {
      repository.findOne.mockResolvedValue(
        makeAdvisor({ password: await hashPassword('senha1') })
      )

      await service.updatePassword('orientador@ufba.br', 'senha1', 'nova1')

      const [criterio, change] = repository.update.mock.calls[0]
      expect(criterio).toEqual({ email: 'orientador@ufba.br' })
      await expect(comparePassword('nova1', change.password)).resolves.toBe(
        true
      )
    })

    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.updatePassword('sumiu@ufba.br', 'senha1', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('resetPassword', () => {
    it.each([
      [undefined, false],
      [false, false]
    ])(
      'quando o privilégio de admin não é pedido, procura o orientador sem privilégio (%s → %s)',
      async (informado, esperado) => {
        repository.findOne.mockResolvedValue(makeAdvisor())

        await service.resetPassword(
          'orientador@ufba.br',
          'nova1',
          informado as boolean
        )

        expect(repository.findOne).toHaveBeenCalledWith({
          where: {
            email: 'orientador@ufba.br',
            has_admin_privileges: esperado
          }
        })
      }
    )

    it.each([[true, true]])(
      'quando o privilégio de admin é pedido, procura o orientador com privilégio (%s → %s)',
      async (informado, esperado) => {
        repository.findOne.mockResolvedValue(makeAdvisor())

        await service.resetPassword(
          'orientador@ufba.br',
          'nova1',
          informado as boolean
        )

        expect(repository.findOne).toHaveBeenCalledWith({
          where: {
            email: 'orientador@ufba.br',
            has_admin_privileges: esperado
          }
        })
      }
    )

    it('quando a senha é redefinida, grava a nova senha hasheada', async () => {
      repository.findOne.mockResolvedValue(makeAdvisor())

      await service.resetPassword('orientador@ufba.br', 'nova1')

      const [, change] = repository.update.mock.calls[0]
      expect(change.password).not.toBe('nova1')
      await expect(comparePassword('nova1', change.password)).resolves.toBe(
        true
      )
    })

    it('quando não encontra o orientador, lança NotFound e não altera nada', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.resetPassword('sumiu@ufba.br', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(repository.update).not.toHaveBeenCalled()
    })
  })

  describe('grantAdminPrivileges', () => {
    it.each([
      [false, true],
      [true, false]
    ])(
      'quando o método é chamado, alterna o privilégio de administrador em vez de concedê-lo (%s → %s)',
      async (atual, esperado) => {
        repository.findOne.mockResolvedValue(
          makeAdvisor({ has_admin_privileges: atual })
        )

        await service.grantAdminPrivileges(9)

        expect(repository.update).toHaveBeenCalledWith(
          { id: 9 },
          { has_admin_privileges: esperado }
        )
      }
    )

    it('quando o orientador não existe, lança NotFound e não altera nada', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(service.grantAdminPrivileges(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
      expect(repository.update).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('quando uma linha foi apagada, confirma a remoção', async () => {
      repository.delete.mockResolvedValue({ affected: 1 })

      await expect(service.delete(9)).resolves.toBe(true)
    })

    it('quando nenhuma linha foi apagada, lança NotFound', async () => {
      repository.delete.mockResolvedValue({ affected: 0 })

      await expect(service.delete(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('findAll', () => {
    it('quando a listagem é pedida, lista os orientadores em ordem alfabética', async () => {
      await service.findAll()

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { name: 'ASC' } })
      )
    })

    it('quando a listagem é para filtro, não carrega as orientações', async () => {
      await service.findAllForFilter()

      expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
    })
  })
})
