import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailService } from './email.service'

const EMAIL = {
  to: 'usuario@ufba.br',
  subject: 'Assunto',
  template: 'reset-password-request',
  context: {}
}

describe('EmailService', () => {
  let mailerService: { sendMail: ReturnType<typeof vi.fn> }
  let service: EmailService

  beforeEach(() => {
    mailerService = { sendMail: vi.fn().mockResolvedValue(undefined) }
    service = new EmailService(mailerService as never)
  })

  it('sendEmail entrega o e-mail pelo mailer', async () => {
    await service.sendEmail(EMAIL)

    expect(mailerService.sendMail).toHaveBeenCalledWith(EMAIL)
  })

  it('sendEmail, quando o envio falha, só registra o erro e não interrompe quem chamou', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('SMTP fora do ar'))

    await expect(service.sendEmail(EMAIL)).resolves.toBeUndefined()
  })

  it('sendEmail com throwOnError, quando o envio falha, propaga o erro', async () => {
    const erro = new Error('SMTP fora do ar')
    mailerService.sendMail.mockRejectedValue(erro)

    await expect(service.sendEmail(EMAIL, { throwOnError: true })).rejects.toBe(
      erro
    )
  })
})
