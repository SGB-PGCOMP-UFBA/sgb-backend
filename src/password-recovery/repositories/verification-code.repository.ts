import { VerificationCode } from '@/password-recovery/entities/verification-code.entity'
import { UserType } from '@/user/user-type.constant'

export type NewVerificationCode = Pick<
  VerificationCode,
  'account_id' | 'account_table' | 'code_hash' | 'expires_at'
>

export abstract class VerificationCodeRepository {
  abstract findLatestByAccount(
    accountTable: UserType,
    accountId: number
  ): Promise<VerificationCode | null>
  abstract create(data: NewVerificationCode): Promise<VerificationCode>
  abstract deleteByAccount(
    accountTable: UserType,
    accountId: number
  ): Promise<void>
  abstract incrementAttempts(id: number): Promise<void>
  abstract markAsUsed(id: number, usedAt: Date): Promise<void>
}
