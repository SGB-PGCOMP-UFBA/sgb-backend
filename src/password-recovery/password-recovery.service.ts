import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { EmailService } from '@/email/email.service'
import { AdvisorService } from '@/advisor/advisor.service'
import { StudentService } from '@/student/student.service'
import { AdminService } from '@/admin/admin.service'
import { UserService } from '@/user/user.service'
import { generateRandomNumber } from '@/common/utils/string.util'
import { ResetPasswordRequestDto } from '@/password-recovery/dtos/reset-password-request.dto'

type AccountTable = 'STUDENT' | 'ADVISOR' | 'ADMIN'

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name)

  constructor(
    private emailService: EmailService,
    private advisorService: AdvisorService,
    private studentService: StudentService,
    private adminService: AdminService,
    private userService: UserService
  ) {}

  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const table = await this.findAccountTable(dto.email, dto.role)
    const newPassword = generateRandomNumber(4)

    await this.emailService.sendEmail(
      {
        to: dto.email,
        subject: 'SGB - Reset de Senha',
        template: 'reset-password-request',
        context: {
          newPassword
        }
      },
      { throwOnError: true }
    )

    this.logger.log(`Password Reseted Email Sent: ${dto.email}`)

    await this.savePassword(table, dto.email, newPassword)

    this.logger.log(`Password Reseted: ${dto.email}`)
  }

  private async findAccountTable(
    email: string,
    role: string
  ): Promise<AccountTable> {
    try {
      return await this.resolveAccountTable(email, role)
    } catch (error) {
      this.logger.error(`Reset Password Fail: ${email}`)

      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          'O usuário não foi encontrado ou possui um cargo diferente.'
        )
      }

      throw error
    }
  }

  private async resolveAccountTable(
    email: string,
    role: string
  ): Promise<AccountTable> {
    switch (role) {
      case 'STUDENT':
      case 'ADVISOR':
        await this.userService.findUserByEmailAndRole(email, role)
        return role
      case 'ADMIN': {
        const user = await this.userService.findUserByEmailAndRole(
          email,
          'ADMIN'
        )
        return user.role === 'ADVISOR_WITH_ADMIN_PRIVILEGES'
          ? 'ADVISOR'
          : 'ADMIN'
      }
      case 'ADVISOR_WITH_ADMIN_PRIVILEGES': {
        const user = await this.userService.findUserByEmailAndRole(
          email,
          'ADMIN'
        )
        if (user.role !== 'ADVISOR_WITH_ADMIN_PRIVILEGES') {
          throw new NotFoundException()
        }
        return 'ADVISOR'
      }
      default:
        throw new BadRequestException(`Cargo inválido: ${role}.`)
    }
  }

  private async savePassword(
    table: AccountTable,
    email: string,
    newPassword: string
  ): Promise<void> {
    switch (table) {
      case 'STUDENT':
        return this.studentService.setPasswordByEmail(email, newPassword)
      case 'ADVISOR':
        return this.advisorService.setPasswordByEmail(email, newPassword)
      case 'ADMIN':
        return this.adminService.setPasswordByEmail(email, newPassword)
    }
  }
}
