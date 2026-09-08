import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStudent } from '../../../core/testing/factories'
import { createRepositoryMock } from '../../../core/testing/repository.mock'
import { comparePassword, hashPassword } from '../../../core/utils/bcrypt'
import { constants } from '../../../core/utils/constants'
import { CreateStudentDto } from '../dto/create-student.dto'
import { UpdateStudentDto } from '../dto/update-student.dto'
import { StudentService } from './student.service'

const CREATE_DTO: CreateStudentDto = {
  name: 'Ana Souza',
  email: 'ana@ufba.br',
  password: 'senha1',
  link_to_lattes: 'http://lattes.cnpq.br/1',
  tax_id: '12345678901',
  phone_number: '71999999999'
}

describe('StudentService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let embedNotificationService: { create: ReturnType<typeof vi.fn> }
  let service: StudentService

  beforeEach(() => {
    repository = createRepositoryMock({
      update: vi.fn().mockResolvedValue({ affected: 1 })
    })
    embedNotificationService = { create: vi.fn().mockResolvedValue({}) }
    service = new StudentService(embedNotificationService as never, repository)
  })

  describe('create', () => {
    it('quando um estudante é cadastrado, grava a senha hasheada e nunca em texto puro', async () => {
      await service.create(CREATE_DTO)

      const gravado = repository.create.mock.calls[0][0]
      expect(gravado.password).not.toBe('senha1')
      await expect(comparePassword('senha1', gravado.password)).resolves.toBe(
        true
      )
    })

    it('quando o estudante é cadastrado, cria a notificação de boas-vindas', async () => {
      repository.create.mockImplementation((data: object) => ({
        ...data,
        id: 4
      }))

      await service.create(CREATE_DTO)

      expect(embedNotificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ owner_id: 4, owner_type: 'STUDENT' })
      )
    })

    it('quando o banco acusa violação de unicidade, traduz o erro para "e-mail ou CPF já em uso"', async () => {
      repository.save.mockRejectedValue(
        new Error(
          'duplicate key value violates unique constraint "UQ_student_email"'
        )
      )

      await expect(service.create(CREATE_DTO)).rejects.toThrow(
        'Email or CPF already in use'
      )
    })

    it('quando a gravação falha por outro motivo, recusa o cadastro', async () => {
      repository.save.mockRejectedValue(new Error('connection terminated'))

      const erro = await service.create(CREATE_DTO).catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe('connection terminated')
    })
  })

  describe('createOrReturnExistent', () => {
    it('quando o estudante já está cadastrado, devolve-o sem regravar nem renotificar', async () => {
      const existente = makeStudent()
      repository.findOneBy.mockResolvedValue(existente)

      await expect(service.createOrReturnExistent(CREATE_DTO)).resolves.toBe(
        existente
      )
      expect(repository.save).not.toHaveBeenCalled()
      expect(embedNotificationService.create).not.toHaveBeenCalled()
    })

    it('quando o e-mail ainda não existe, cadastra e notifica o estudante', async () => {
      repository.findOneBy.mockResolvedValue(null)

      await service.createOrReturnExistent(CREATE_DTO)

      expect(repository.save).toHaveBeenCalledTimes(1)
      expect(embedNotificationService.create).toHaveBeenCalledTimes(1)
    })

    it('quando procura duplicidade, busca apenas pelo e-mail informado', async () => {
      await service.createOrReturnExistent(CREATE_DTO)

      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: 'ana@ufba.br'
      })
    })
  })

  describe('findByEmail', () => {
    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.findByEmail('inexistente@ufba.br')
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando as relações não são pedidas, não carrega as relações pesadas', async () => {
      repository.findOne.mockResolvedValue(makeStudent())

      await service.findByEmail('ana@ufba.br')

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'ana@ufba.br' },
        relations: []
      })
    })

    it('quando as relações são pedidas, carrega matrículas, orientador e bolsas', async () => {
      repository.findOne.mockResolvedValue(makeStudent())

      await service.findByEmail('ana@ufba.br', true)

      const { relations } = repository.findOne.mock.calls[0][0]
      expect(relations).toContain('enrollments')
      expect(relations).toContain('enrollments.advisor')
      expect(relations).toContain('enrollments.scholarships.agency')
    })
  })

  describe('resetPassword', () => {
    it('quando o e-mail não existe, lança NotFound e não altera nada', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.resetPassword('inexistente@ufba.br', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a senha é redefinida, grava a nova senha hasheada', async () => {
      repository.findOne.mockResolvedValue(makeStudent())

      await service.resetPassword('ana@ufba.br', 'nova1')

      const [criterio, alteracao] = repository.update.mock.calls[0]
      expect(criterio).toEqual({ email: 'ana@ufba.br' })
      expect(alteracao.password).not.toBe('nova1')
      await expect(comparePassword('nova1', alteracao.password)).resolves.toBe(
        true
      )
    })
  })

  describe('updatePassword', () => {
    it('quando a senha atual não confere, recusa a troca', async () => {
      repository.findOne.mockResolvedValue(
        makeStudent({ password: await hashPassword('senha1') })
      )

      const erro = await service
        .updatePassword('ana@ufba.br', 'senha-errada', 'nova1')
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a senha atual confere, troca a senha', async () => {
      repository.findOne.mockResolvedValue(
        makeStudent({ password: await hashPassword('senha1') })
      )

      await service.updatePassword('ana@ufba.br', 'senha1', 'nova1')

      const [, alteracao] = repository.update.mock.calls[0]
      await expect(comparePassword('nova1', alteracao.password)).resolves.toBe(
        true
      )
    })

    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.updatePassword('inexistente@ufba.br', 'senha1', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('update', () => {
    const ATUAL = makeStudent({ name: 'Ana Souza', email: 'ana@ufba.br' })

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
      ],
      [
        'link do lattes',
        { link_to_lattes: 'http://lattes.cnpq.br/2' },
        constants.negotialValidationMessages.LINK_TO_LATTES_ALREADY_REGISTERED
      ]
    ])(
      'quando o valor já está em uso por outro estudante, recusa a alteração (%s)',
      async (_campo, alteracao, mensagem) => {
        repository.findOneBy
          .mockResolvedValueOnce(ATUAL)
          .mockResolvedValue(makeStudent({ id: 99 }))

        const erro = await service
          .update({
            current_email: 'ana@ufba.br',
            ...alteracao
          } as UpdateStudentDto)
          .catch((e) => e)

        expect(erro).toBeInstanceOf(BadRequestException)
        expect(erro.message).toBe(mensagem)
        expect(repository.save).not.toHaveBeenCalled()
      }
    )

    it('quando os campos são reenviados sem alteração, não checa duplicidade', async () => {
      repository.findOneBy.mockResolvedValue(ATUAL)

      await service.update({
        current_email: 'ana@ufba.br',
        email: ATUAL.email,
        tax_id: ATUAL.tax_id,
        phone_number: ATUAL.phone_number,
        link_to_lattes: ATUAL.link_to_lattes
      } as UpdateStudentDto)

      expect(repository.findOneBy).toHaveBeenCalledTimes(1)
      expect(repository.save).toHaveBeenCalledTimes(1)
    })

    it('quando o dto não informa nome e e-mail, mantém os valores atuais', async () => {
      repository.findOneBy.mockResolvedValue(ATUAL)

      await service.update({
        current_email: 'ana@ufba.br'
      } as UpdateStudentDto)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ATUAL.id,
          name: 'Ana Souza',
          email: 'ana@ufba.br'
        })
      )
    })

    it('quando o current_email não existe, lança NotFound', async () => {
      repository.findOneBy.mockResolvedValue(null)

      await expect(
        service.update({ current_email: 'sumiu@ufba.br' } as UpdateStudentDto)
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando a gravação falha, converte em erro de atualização', async () => {
      repository.findOneBy.mockResolvedValue(ATUAL)
      repository.save.mockRejectedValue(new Error('connection terminated'))

      const erro = await service
        .update({ current_email: 'ana@ufba.br' } as UpdateStudentDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.exceptionMessages.student.UPDATE_FAILED
      )
    })
  })

  describe('delete', () => {
    it('quando uma linha foi apagada, confirma a remoção', async () => {
      repository.delete.mockResolvedValue({ affected: 1 })

      await expect(service.delete(4)).resolves.toBe(true)
    })

    it('quando nenhuma linha foi apagada, lança NotFound', async () => {
      repository.delete.mockResolvedValue({ affected: 0 })

      await expect(service.delete(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })
})
