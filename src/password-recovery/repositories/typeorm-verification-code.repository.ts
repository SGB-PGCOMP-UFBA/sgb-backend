import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { VerificationCode } from '@/password-recovery/entities/verification-code.entity'
import { AccountTable } from '@/password-recovery/account-table.constant'
import {
  NewVerificationCode,
  VerificationCodeRepository
} from '@/password-recovery/repositories/verification-code.repository'

@Injectable()
export class TypeOrmVerificationCodeRepository
  implements VerificationCodeRepository
{
  constructor(
    @InjectRepository(VerificationCode)
    private readonly repository: Repository<VerificationCode>
  ) {}

  async findLatestByAccount(
    accountTable: AccountTable,
    accountId: number
  ): Promise<VerificationCode | null> {
    return await this.repository.findOne({
      where: { account_table: accountTable, account_id: accountId },
      order: { created_at: 'DESC' }
    })
  }

  async create(data: NewVerificationCode): Promise<VerificationCode> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async deleteByAccount(
    accountTable: AccountTable,
    accountId: number
  ): Promise<void> {
    await this.repository.delete({
      account_table: accountTable,
      account_id: accountId
    })
  }

  async incrementAttempts(id: number): Promise<void> {
    await this.repository.increment({ id }, 'attempts', 1)
  }

  async markAsUsed(id: number, usedAt: Date): Promise<void> {
    await this.repository.update({ id }, { used_at: usedAt })
  }
}
