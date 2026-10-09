import { VerificationCode } from '@/password-recovery/entities/verification-code.entity'
import { AccountTable } from '@/password-recovery/account-table.constant'

export type NewVerificationCode = Pick<
  VerificationCode,
  'account_id' | 'account_table' | 'code_hash' | 'expires_at'
>

export abstract class VerificationCodeRepository {
  abstract findLatestByAccount(
    accountTable: AccountTable,
    accountId: number
  ): Promise<VerificationCode | null>
  abstract create(data: NewVerificationCode): Promise<VerificationCode>
  abstract deleteByAccount(
    accountTable: AccountTable,
    accountId: number
  ): Promise<void>
  abstract incrementAttempts(id: number): Promise<void>
  abstract markAsUsed(id: number, usedAt: Date): Promise<void>
}
