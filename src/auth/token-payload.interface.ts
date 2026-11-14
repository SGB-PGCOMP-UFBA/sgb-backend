import { ResponseUserDto } from '@/user/dtos/response-user.dto'

export interface AccessTokenPayload {
  type: 'access'
  sub: string
  role: string
  username: string
  authenticated_at: string
}

export interface RefreshTokenPayload {
  type: 'refresh'
  sub: string
  role: string
  authenticated_at: string
  jti: string
}

export interface RefreshSession {
  user: ResponseUserDto
  tokenId: string
  authenticatedAt: string
}

export interface SessionTokens {
  access_token: string
  refresh_token: string
}
