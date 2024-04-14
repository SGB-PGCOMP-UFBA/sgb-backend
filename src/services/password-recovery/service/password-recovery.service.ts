import { Injectable } from '@nestjs/common'
import { EmailService } from '../../../services/email-sending/service/email.service'
import { AdvisorService } from '../../../modules/advisor/service/advisor.service'
import { StudentService } from '../../../modules/student/service/student.service'
import { generateRandomString } from '../../../core/utils/string-utils'
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto'

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private emailService: EmailService,
    private advisorService: AdvisorService,
    private studentService: StudentService
  ) {}

  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const newPassword = generateRandomString(8)

    const serviceMap = {
      ADVISOR: this.advisorService,
      STUDENT: this.studentService
    }

    const service = serviceMap[dto.role]

    await service.resetPassword(dto.email, newPassword)

    await this.emailService.sendEmail({
      to: dto.email,
      template: 'reset-password-request',
      context: {
        newPassword
      }
    })
  }
}
