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
      this.logger.error(`Error sendint e-mail to ${dto.to}.`, error)
    }
  }
}
