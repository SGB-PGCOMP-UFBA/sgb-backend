import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('refresh_token')
@Index('IDX_REFRESH_TOKEN_USER', ['user_id'])
export class RefreshToken {
  /**
   * Gerado pela aplicação, e não pelo banco, porque vira o `jti` do token, e
   * o hash do token precisa existir antes do insert.
   */
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'integer', nullable: false })
  user_id: number

  @Column({ type: 'varchar', nullable: false, unique: true })
  token_hash: string

  @Column({ type: 'timestamptz', nullable: false })
  expires_at: Date

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null

  /** Preenchido na renovação: um token trocado que volta é sinal de cópia. */
  @Column({ type: 'uuid', nullable: true })
  replaced_by_id: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date
}
