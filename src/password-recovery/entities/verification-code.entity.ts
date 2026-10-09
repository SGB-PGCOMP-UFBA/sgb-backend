import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { AccountTable } from '@/password-recovery/account-table.constant'

@Entity('verification_code')
@Index('IDX_VERIFICATION_CODE_ACCOUNT', ['account_table', 'account_id'])
export class VerificationCode {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'integer', nullable: false })
  account_id: number

  @Column({ type: 'varchar', nullable: false })
  account_table: AccountTable

  @Column({ type: 'varchar', nullable: false })
  code_hash: string

  @Column({ type: 'timestamptz', nullable: false })
  expires_at: Date

  @Column({ type: 'integer', nullable: false, default: 0 })
  attempts: number

  @Column({ type: 'timestamptz', nullable: true })
  used_at: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date
}
