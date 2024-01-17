import { Injectable } from '@nestjs/common'

import { MailerService } from '@nestjs-modules/mailer'
import { EmailDto } from '../dto/email.dto'

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(dto: EmailDto) {
    await this.mailerService.sendMail(dto)
  }
}
