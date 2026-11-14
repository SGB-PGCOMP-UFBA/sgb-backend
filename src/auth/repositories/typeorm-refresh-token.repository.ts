import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { RefreshToken } from '@/auth/entities/refresh-token.entity'
import {
  NewRefreshToken,
  RefreshTokenRepository
} from '@/auth/repositories/refresh-token.repository'

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>
  ) {}

  async findById(id: string): Promise<RefreshToken | null> {
    return await this.repository.findOneBy({ id })
  }

  async create(data: NewRefreshToken): Promise<RefreshToken> {
    return await this.repository.save(this.repository.create({ ...data }))
  }

  async revoke(
    id: string,
    revokedAt: Date,
    replacedById?: string
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id, revoked_at: IsNull() },
      { revoked_at: revokedAt, replaced_by_id: replacedById ?? null }
    )

    return result.affected === 1
  }

  async revokeAllByUser(userId: number, revokedAt: Date): Promise<void> {
    await this.repository.update(
      { user_id: userId, revoked_at: IsNull() },
      { revoked_at: revokedAt }
    )
  }
}
