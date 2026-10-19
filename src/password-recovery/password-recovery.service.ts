import { randomInt } from 'node:crypto'
import { addMinutes, differenceInSeconds, isBefore } from 'date-fns'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { EmailService } from '@/email/email.service'
import { StudentRepository } from '@/student/repositories/student.repository'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { VerificationCodeRepository } from '@/password-recovery/repositories/verification-code.repository'
import { VerificationCode } from '@/password-recovery/entities/verification-code.entity'
import { AccountTable } from '@/password-recovery/account-table.constant'
import { ResetPasswordRequestDto } from '@/password-recovery/dtos/reset-password-request.dto'
import { VerifyRecoveryCodeDto } from '@/password-recovery/dtos/verify-recovery-code.dto'
import { ConfirmPasswordRecoveryDto } from '@/password-recovery/dtos/confirm-password-recovery.dto'
import { UserRole } from '@/user/user-role.constant'
import {
  comparePasswordOrDecoy,
  hashPassword
} from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'

const CODE_LENGTH = 6
const CODE_TTL_MINUTES = 15
const RESEND_COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS = 5

const messages = constants.exceptionMessages.passwordRecovery

interface Account {
  id: number
  table: AccountTable
}

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name)

  constructor(
    private readonly emailService: EmailService,
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly studentRepository: StudentRepository,
    private readonly advisorRepository: AdvisorRepository,
    private readonly adminRepository: AdminRepository
  ) {}

  /**
   * Responde antes de procurar a conta e enviar o e-mail. Se a resposta
   * esperasse o envio, uma conta existente demoraria segundos (SMTP) e uma
   * inexistente voltaria na hora; falhas de e-mail e o intervalo entre envios
   * também só apareceriam para contas reais. Tudo isso revelaria quais
   * e-mails estão cadastrados.
   */
  requestCode(dto: ResetPasswordRequestDto): void {
    this.sendCode(dto).catch((error: Error) =>
      this.logger.error(
        `Password recovery code could not be sent: ${dto.email}`,
        error?.stack
      )
    )
  }

  async sendCode(dto: ResetPasswordRequestDto): Promise<void> {
    const account = await this.findAccount(dto.email, dto.role)

    if (!account) {
      this.logger.warn(`Password recovery for unknown account: ${dto.email}`)
      return
    }

    const latest = await this.verificationCodeRepository.findLatestByAccount(
      account.table,
      account.id
    )

    if (
      latest &&
      differenceInSeconds(new Date(), latest.created_at) <
        RESEND_COOLDOWN_SECONDS
    ) {
      this.logger.warn(`Password recovery requested too soon: ${dto.email}`)
      return
    }

    const code = generateCode()
    const codeHash = await hashPassword(code)

    await this.emailService.sendEmail(
      {
        to: dto.email,
        subject: 'SGB - Código de recuperação de senha',
        template: 'reset-password-code',
        context: { code, expiresInMinutes: CODE_TTL_MINUTES }
      },
      { throwOnError: true }
    )

    await this.verificationCodeRepository.deleteByAccount(
      account.table,
      account.id
    )
    await this.verificationCodeRepository.create({
      account_id: account.id,
      account_table: account.table,
      code_hash: codeHash,
      expires_at: addMinutes(new Date(), CODE_TTL_MINUTES)
    })

    this.logger.log(`Password recovery code sent: ${dto.email}`)
  }

  async verifyCode(dto: VerifyRecoveryCodeDto): Promise<void> {
    await this.checkCode(dto)
  }

  async confirmReset(dto: ConfirmPasswordRecoveryDto): Promise<void> {
    const { account, verificationCode } = await this.checkCode(dto)

    await this.savePassword(account, await hashPassword(dto.new_password))
    await this.verificationCodeRepository.markAsUsed(
      verificationCode.id,
      new Date()
    )

    this.logger.log(`Password reset by recovery code: ${dto.email}`)
  }

  /**
   * Todo código recusado sai com a mesma mensagem e passa pelo mesmo bcrypt.
   * Mensagens de "expirado" ou "limite de tentativas" só existiriam para
   * contas reais com código pendente, e serviriam para descobrir e-mails.
   */
  private async checkCode(
    dto: VerifyRecoveryCodeDto
  ): Promise<{ account: Account; verificationCode: VerificationCode }> {
    const account = await this.findAccount(dto.email, dto.role)
    const verificationCode = account
      ? await this.verificationCodeRepository.findLatestByAccount(
          account.table,
          account.id
        )
      : null
    const usable = isUsable(verificationCode)

    const matches = await comparePasswordOrDecoy(
      dto.code,
      usable ? verificationCode.code_hash : null
    )

    if (!usable) {
      throw new BadRequestException(messages.INVALID_CODE)
    }

    if (!matches) {
      await this.verificationCodeRepository.incrementAttempts(
        verificationCode.id
      )
      throw new BadRequestException(messages.INVALID_CODE)
    }

    return { account, verificationCode }
  }

  private async findAccount(
    email: string,
    role: UserRole
  ): Promise<Account | null> {
    switch (role) {
      case 'STUDENT':
        return toAccount(
          await this.studentRepository.findByEmail(email),
          'STUDENT'
        )
      case 'ADVISOR':
        return toAccount(
          await this.advisorRepository.findByEmail(email),
          'ADVISOR'
        )
      case 'ADVISOR_WITH_ADMIN_PRIVILEGES':
        return toAccount(
          await this.advisorRepository.findByEmailAndAdminPrivileges(
            email,
            true
          ),
          'ADVISOR'
        )
      case 'ADMIN': {
        const advisor =
          await this.advisorRepository.findByEmailAndAdminPrivileges(
            email,
            true
          )

        if (advisor) return { id: advisor.id, table: 'ADVISOR' }

        return toAccount(await this.adminRepository.findByEmail(email), 'ADMIN')
      }
      default:
        return null
    }
  }

  private async savePassword(
    account: Account,
    passwordHash: string
  ): Promise<void> {
    switch (account.table) {
      case 'STUDENT':
        return this.studentRepository.updatePasswordById(
          account.id,
          passwordHash
        )
      case 'ADVISOR':
        return this.advisorRepository.updatePasswordById(
          account.id,
          passwordHash
        )
      case 'ADMIN':
        return this.adminRepository.updatePasswordById(account.id, passwordHash)
    }
  }
}

function generateCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, '0')
}

function isUsable(code: VerificationCode | null): boolean {
  return (
    !!code &&
    !code.used_at &&
    isBefore(new Date(), code.expires_at) &&
    code.attempts < MAX_ATTEMPTS
  )
}

function toAccount(
  user: { id: number } | null,
  table: AccountTable
): Account | null {
  return user ? { id: user.id, table } : null
}
