import { RefreshToken } from '@/auth/entities/refresh-token.entity'

export type NewRefreshToken = Pick<
  RefreshToken,
  'id' | 'user_id' | 'token_hash' | 'expires_at'
>

export abstract class RefreshTokenRepository {
  abstract findById(id: string): Promise<RefreshToken | null>
  abstract create(data: NewRefreshToken): Promise<RefreshToken>
  /**
   * Só revoga se o token ainda estiver ativo e devolve se revogou. Duas
   * renovações simultâneas com o mesmo token não podem as duas vencer.
   */
  abstract revoke(
    id: string,
    revokedAt: Date,
    replacedById?: string
  ): Promise<boolean>
  abstract revokeAllByUser(userId: number, revokedAt: Date): Promise<void>
}
