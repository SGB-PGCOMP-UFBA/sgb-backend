import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStudent } from '@/common/testing/factories'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { CreateStudentDto } from '@/student/dtos/create-student.dto'
import { UpdateStudentDto } from '@/student/dtos/update-student.dto'
import { StudentRepository } from '@/student/repositories/student.repository'
import { StudentService } from './student.service'

const CREATE_DTO: CreateStudentDto = {
  name: 'Ana Souza',
  email: 'ana@ufba.br',
  password: 'senha1',
  link_to_lattes: 'http://lattes.cnpq.br/1',
  tax_id: '12345678901',
  phone_number: '71999999999'
}

function createStudentRepositoryMock() {
  return {
    findAllWithEnrollments: vi.fn().mockResolvedValue([]),
    findAllByAdvisorId: vi.fn().mockResolvedValue([]),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByEmailWithEnrollments: vi.fn().mockResolvedValue(null),
    findByTaxId: vi.fn().mockResolvedValue(null),
    findByPhoneNumber: vi.fn().mockResolvedValue(null),
    findByLinkToLattes: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (data: object) => ({ ...data, id: 4 })),
    update: vi.fn(async (_id: number, data: unknown) => data),
    updatePasswordByEmail: vi.fn().mockResolvedValue(undefined),
    deleteById: vi.fn().mockResolvedValue(1),
    deleteAllAndResetSequence: vi.fn().mockResolvedValue(undefined)
  } satisfies Record<keyof StudentRepository, unknown>
}

describe('StudentService', () => {
  let repository: ReturnType<typeof createStudentRepositoryMock>
  let embedNotificationService: { create: ReturnType<typeof vi.fn> }
  let service: StudentService

  beforeEach(() => {
    repository = createStudentRepositoryMock()
    embedNotificationService = { create: vi.fn().mockResolvedValue({}) }
    service = new StudentService(
      embedNotificationService as never,
      repository as unknown as StudentRepository
    )
  })

  describe('create', () => {
    it('quando um estudante é cadastrado, grava a senha hasheada e nunca em texto puro', async () => {
      await service.create(CREATE_DTO)

      const gravado = repository.create.mock.calls[0][0] as CreateStudentDto
      expect(gravado.password).not.toBe('senha1')
      await expect(comparePassword('senha1', gravado.password)).resolves.toBe(
        true
      )
    })

    it('quando o estudante é cadastrado, cria a notificação de boas-vindas com o id gerado', async () => {
      await service.create(CREATE_DTO)

      expect(embedNotificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ owner_id: 4, owner_type: 'STUDENT' })
      )
    })

    it('quando o banco acusa violação de unicidade, traduz o erro para "e-mail ou CPF já em uso"', async () => {
      repository.create.mockRejectedValue(
        new Error(
          'duplicate key value violates unique constraint "UQ_student_email"'
        )
      )

      await expect(service.create(CREATE_DTO)).rejects.toThrow(
        'Email or CPF already in use'
      )
    })

    it('quando a gravação falha por outro motivo, recusa o cadastro', async () => {
      repository.create.mockRejectedValue(new Error('connection terminated'))

      const erro = await service.create(CREATE_DTO).catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe('connection terminated')
    })
  })

  describe('createOrReturnExistent', () => {
    it('quando o estudante já está cadastrado, devolve-o sem regravar nem renotificar', async () => {
      const existente = makeStudent()
      repository.findByEmail.mockResolvedValue(existente)

      await expect(service.createOrReturnExistent(CREATE_DTO)).resolves.toBe(
        existente
      )
      expect(repository.create).not.toHaveBeenCalled()
      expect(embedNotificationService.create).not.toHaveBeenCalled()
    })

    it('quando o e-mail ainda não existe, cadastra e notifica o estudante', async () => {
      await service.createOrReturnExistent(CREATE_DTO)

      expect(repository.create).toHaveBeenCalledTimes(1)
      expect(embedNotificationService.create).toHaveBeenCalledTimes(1)
    })

    it('quando procura duplicidade, busca apenas pelo e-mail informado', async () => {
      await service.createOrReturnExistent(CREATE_DTO)

      expect(repository.findByEmail).toHaveBeenCalledWith('ana@ufba.br')
    })

    it('quando a gravação falha, não traduz a violação de unicidade como o create faz', async () => {
      repository.create.mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      )

      await expect(service.createOrReturnExistent(CREATE_DTO)).rejects.toThrow(
        'duplicate key value violates unique constraint'
      )
    })
  })

  describe('findByEmail', () => {
    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      await expect(
        service.findByEmail('inexistente@ufba.br')
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando as relações não são pedidas, usa a busca sem relações', async () => {
      repository.findByEmail.mockResolvedValue(makeStudent())

      await service.findByEmail('ana@ufba.br')

      expect(repository.findByEmail).toHaveBeenCalledWith('ana@ufba.br')
      expect(repository.findByEmailWithEnrollments).not.toHaveBeenCalled()
    })

    it('quando as relações são pedidas, usa a busca que carrega matrículas', async () => {
      repository.findByEmailWithEnrollments.mockResolvedValue(makeStudent())

      await service.findByEmail('ana@ufba.br', true)

      expect(repository.findByEmailWithEnrollments).toHaveBeenCalledWith(
        'ana@ufba.br'
      )
      expect(repository.findByEmail).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('quando o e-mail não existe, lança NotFound e não altera nada', async () => {
      await expect(
        service.resetPassword('inexistente@ufba.br', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(repository.updatePasswordByEmail).not.toHaveBeenCalled()
    })

    it('quando a senha é redefinida, grava a nova senha hasheada', async () => {
      repository.findByEmail.mockResolvedValue(makeStudent())

      await service.resetPassword('ana@ufba.br', 'nova1')

      const [email, hash] = repository.updatePasswordByEmail.mock.calls[0]
      expect(email).toBe('ana@ufba.br')
      expect(hash).not.toBe('nova1')
      await expect(comparePassword('nova1', hash)).resolves.toBe(true)
    })
  })

  describe('updatePassword', () => {
    it('quando a senha atual não confere, recusa a troca', async () => {
      repository.findByEmail.mockResolvedValue(
        makeStudent({ password: await hashPassword('senha1') })
      )

      const erro = await service
        .updatePassword('ana@ufba.br', 'senha-errada', 'nova1')
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
      expect(repository.updatePasswordByEmail).not.toHaveBeenCalled()
    })

    it('quando a senha atual confere, troca a senha', async () => {
      repository.findByEmail.mockResolvedValue(
        makeStudent({ password: await hashPassword('senha1') })
      )

      await service.updatePassword('ana@ufba.br', 'senha1', 'nova1')

      const [, hash] = repository.updatePasswordByEmail.mock.calls[0]
      await expect(comparePassword('nova1', hash)).resolves.toBe(true)
    })

    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      await expect(
        service.updatePassword('inexistente@ufba.br', 'senha1', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('update', () => {
    const ATUAL = makeStudent({ name: 'Ana Souza', email: 'ana@ufba.br' })

    beforeEach(() => {
      repository.findByEmail.mockResolvedValue(ATUAL)
    })

    it.each([
      [
        'CPF',
        'findByTaxId' as const,
        { tax_id: '99999999999' },
        constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
      ],
      [
        'telefone',
        'findByPhoneNumber' as const,
        { phone_number: '71888888888' },
        constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
      ],
      [
        'link do lattes',
        'findByLinkToLattes' as const,
        { link_to_lattes: 'http://lattes.cnpq.br/2' },
        constants.negotialValidationMessages.LINK_TO_LATTES_ALREADY_REGISTERED
      ]
    ])(
      'quando o valor já está em uso por outro estudante, recusa a alteração (%s)',
      async (_campo, metodo, alteracao, mensagem) => {
        repository[metodo].mockResolvedValue(makeStudent({ id: 99 }))

        const erro = await service
          .update({
            current_email: 'ana@ufba.br',
            ...alteracao
          } as UpdateStudentDto)
          .catch((e) => e)

        expect(erro).toBeInstanceOf(BadRequestException)
        expect(erro.message).toBe(mensagem)
        expect(repository.update).not.toHaveBeenCalled()
      }
    )

    it('quando o e-mail já está em uso por outro estudante, recusa a alteração', async () => {
      repository.findByEmail
        .mockResolvedValueOnce(ATUAL)
        .mockResolvedValue(makeStudent({ id: 99 }))

      const erro = await service
        .update({
          current_email: 'ana@ufba.br',
          email: 'outro@ufba.br'
        } as UpdateStudentDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando os campos são reenviados sem alteração, não checa duplicidade', async () => {
      await service.update({
        current_email: 'ana@ufba.br',
        email: ATUAL.email,
        tax_id: ATUAL.tax_id,
        phone_number: ATUAL.phone_number,
        link_to_lattes: ATUAL.link_to_lattes
      } as UpdateStudentDto)

      expect(repository.findByEmail).toHaveBeenCalledTimes(1)
      expect(repository.findByTaxId).not.toHaveBeenCalled()
      expect(repository.findByPhoneNumber).not.toHaveBeenCalled()
      expect(repository.findByLinkToLattes).not.toHaveBeenCalled()
      expect(repository.update).toHaveBeenCalledTimes(1)
    })

    it('quando o dto não informa nome e e-mail, mantém os valores atuais', async () => {
      await service.update({
        current_email: 'ana@ufba.br'
      } as UpdateStudentDto)

      expect(repository.update).toHaveBeenCalledWith(
        ATUAL.id,
        expect.objectContaining({ name: 'Ana Souza', email: 'ana@ufba.br' })
      )
    })

    it('quando o current_email não existe, lança NotFound', async () => {
      repository.findByEmail.mockResolvedValue(null)

      await expect(
        service.update({ current_email: 'sumiu@ufba.br' } as UpdateStudentDto)
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando a gravação falha, converte em erro de atualização', async () => {
      repository.update.mockRejectedValue(new Error('connection terminated'))

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
      await expect(service.delete(4)).resolves.toBe(true)
    })

    it('quando nenhuma linha foi apagada, lança NotFound', async () => {
      repository.deleteById.mockResolvedValue(0)

      await expect(service.delete(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('deleteAll', () => {
    it('delega ao repositório a limpeza total', async () => {
      await service.deleteAll()

      expect(repository.deleteAllAndResetSequence).toHaveBeenCalled()
    })
  })
})
