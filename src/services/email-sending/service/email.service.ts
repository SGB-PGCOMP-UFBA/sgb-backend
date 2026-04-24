import { Injectable, Logger } from '@nestjs/common'

import { MailerService } from '@nestjs-modules/mailer'
import { EmailDto } from '../dto/email.dto'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  constructor(private mailerService: MailerService) {}

  async sendEmail(dto: EmailDto) {
    try {
      this.logger.log(`Sending e-mail to ${dto.to}.`)
      await this.mailerService.sendMail(dto)
    } catch (error) {
      this.logger.error(`Error sending e-mail to ${dto.to}.`, error)
    }
  }

  async sendEmailStudentAutomaticallyRegistered(
    toEmail: string,
    password: string
  ) {
    const emailDto: EmailDto = {
      to: toEmail,
      subject: 'Você foi adicionado ao SGB-PGCOMP!',
      template: 'student-registered',
      context: {
        newPassword: password
      }
    }
    return await this.sendEmail(emailDto)
  }
}
