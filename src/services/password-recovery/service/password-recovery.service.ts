import { Injectable } from '@nestjs/common'
import { EmailService } from '../../../services/email-sending/service/email.service'
import { StudentService } from '../../../modules/student/service/student.service'
import { generateRandomString } from '../../../core/utils/string-utils'
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto'

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private studentService: StudentService,
    private emailService: EmailService
  ) {}

  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const newPassword = generateRandomString(8)

    await this.studentService.resetPassword(dto.email, newPassword)

    await this.emailService.sendEmail({
      to: dto.email,
      template: 'reset-password-request',
      context: {
        newPassword
      }
    })
  }
}
