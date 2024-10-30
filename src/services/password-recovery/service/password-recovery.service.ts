import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EmailService } from '../../../services/email-sending/service/email.service'
import { AdvisorService } from '../../../modules/advisor/service/advisor.service'
import { StudentService } from '../../../modules/student/service/student.service'
import { AdminService } from '../../../modules/admin/service/admin.service'
import { generateRandomNumber } from '../../../core/utils/string-utils'
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto'

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name)

  constructor(
    private emailService: EmailService,
    private advisorService: AdvisorService,
    private studentService: StudentService,
    private adminService: AdminService
  ) {}

  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const newPassword = generateRandomNumber(4)

    try {
      if (dto.role === 'STUDENT') {
        await this.studentService.resetPassword(dto.email, newPassword)
      } else if (dto.role === 'ADVISOR') {
        try {
          await this.advisorService.resetPassword(dto.email, newPassword)
        } catch (error) {
          if (error instanceof NotFoundException) {
            await this.advisorService.resetPassword(
              dto.email,
              newPassword,
              true
            )
          }
        }
      } else if (dto.role === 'ADVISOR_WITH_ADMIN_PRIVILEGES') {
        await this.advisorService.resetPassword(dto.email, newPassword, true)
      } else if (dto.role === 'ADMIN') {
        try {
          await this.adminService.resetPassword(dto.email, newPassword)
        } catch (error) {
          if (error instanceof NotFoundException) {
            await this.advisorService.resetPassword(
              dto.email,
              newPassword,
              true
            )
          }
        }
      }

      this.logger.log(`Password Reseted: ${dto.email}`)

      await this.emailService.sendEmail({
        to: dto.email,
        subject: 'SGB - Reset de Senha',
        template: 'reset-password-request',
        context: {
          newPassword
        }
      })

      this.logger.log(`Password Reseted Email Sent: ${dto.email}`)
    } catch (error) {
      this.logger.error(`Reset Password Fail: ${dto.email}`)
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          'O usuário não foi encontrado ou possui um cargo diferente.'
        )
      }
    }
  }
}
