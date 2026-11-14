import { createHash, randomUUID } from 'node:crypto'
import { addSeconds, differenceInSeconds, isBefore } from 'date-fns'
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { comparePasswordOrDecoy } from '@/common/utils/bcrypt.util'
import { UserService } from '@/user/user.service'
import { ResponseUserDto } from '@/user/dtos/response-user.dto'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { RefreshTokenRepository } from '@/auth/repositories/refresh-token.repository'
import {
  AccessTokenPayload,
  RefreshSession,
  RefreshTokenPayload,
  SessionTokens
} from '@/auth/token-payload.interface'
import { constants } from '@/common/utils/constants'

/**
 * Duas abas que renovam ao mesmo tempo mandam o mesmo refresh token; a que
 * chega depois encontra o token já trocado. Dentro desta janela isso é
 * corrida, não cópia, e não derruba as outras sessões.
 */
const REUSE_GRACE_SECONDS = 30

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  async validateUser(
    email: string,
    passwordInserted: string,
    role: string
  ): Promise<ResponseUserDto> {
    const user = await this.userService.findUserByEmailAndRole(email, role)
    const validPassword = await comparePasswordOrDecoy(
      passwordInserted,
      user?.password
    )

    if (!user || !validPassword) {
      throw new UnauthorizedException(
        constants.exceptionMessages.auth.INVALID_CREDENTIALS
      )
    }

    return new ResponseUserDto(
      user.id,
      user.tax_id,
      user.name,
      user.role,
      user.email,
      user.phone_number
    )
  }

  async login(loggedUser: ResponseUserDto) {
    const tokens = await this.issueTokens(loggedUser, new Date().toISOString())

    return {
      ...tokens,
      id: loggedUser.id,
      role: loggedUser.role,
      tax_id: loggedUser.tax_id,
      name: loggedUser.name,
      email: loggedUser.email,
      phone_number: loggedUser.phone_number
    }
  }

  async validateRefreshToken(
    token: string,
    payload: RefreshTokenPayload
  ): Promise<RefreshSession> {
    const stored =
      payload?.type === 'refresh' && payload.jti
        ? await this.refreshTokenRepository.findById(payload.jti)
        : null

    if (!stored || stored.token_hash !== hashToken(token)) {
      throw sessionExpired()
    }

    if (stored.revoked_at) {
      if (stored.replaced_by_id && !isWithinReuseGrace(stored.revoked_at)) {
        await this.refreshTokenRepository.revokeAllByUser(
          stored.user_id,
          new Date()
        )
        this.logger.warn(
          `Reused refresh token; all sessions revoked: user ${stored.user_id}`
        )
      }

      throw sessionExpired()
    }

    if (isBefore(stored.expires_at, new Date())) {
      throw sessionExpired()
    }

    const user = await this.userRepository.findById(stored.user_id)

    if (!user || !canStillSignInAs(user, payload.role)) {
      throw sessionExpired()
    }

    return {
      user: new ResponseUserDto(
        user.id,
        user.tax_id,
        user.name,
        payload.role,
        user.email,
        user.phone_number
      ),
      tokenId: stored.id,
      authenticatedAt: payload.authenticated_at
    }
  }

  async refresh(session: RefreshSession): Promise<SessionTokens> {
    const nextTokenId = randomUUID()
    const revoked = await this.refreshTokenRepository.revoke(
      session.tokenId,
      new Date(),
      nextTokenId
    )

    if (!revoked) {
      throw sessionExpired()
    }

    return await this.issueTokens(
      session.user,
      session.authenticatedAt,
      nextTokenId
    )
  }

  async logout(session: RefreshSession): Promise<void> {
    await this.refreshTokenRepository.revoke(session.tokenId, new Date())
  }

  private async issueTokens(
    user: ResponseUserDto,
    authenticatedAt: string,
    refreshTokenId: string = randomUUID()
  ): Promise<SessionTokens> {
    const sub = `${user.id}-${user.role}`
    const accessPayload: AccessTokenPayload = {
      type: 'access',
      authenticated_at: authenticatedAt,
      role: user.role,
      username: user.name,
      sub
    }
    const refreshPayload: Omit<RefreshTokenPayload, 'jti'> = {
      type: 'refresh',
      authenticated_at: authenticatedAt,
      role: user.role,
      sub
    }

    const accessToken = this.jwtService.sign(accessPayload)
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: constants.jwt.REFRESH_SECRET_KEY,
      expiresIn: constants.jwt.REFRESH_EXPIRATION_TIME,
      jwtid: refreshTokenId
    })

    await this.refreshTokenRepository.create({
      id: refreshTokenId,
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: addSeconds(new Date(), constants.jwt.REFRESH_EXPIRATION_TIME)
    })

    return { access_token: accessToken, refresh_token: refreshToken }
  }
}

/**
 * sha256, e não bcrypt: o token já tem entropia de sobra, e o hash precisa
 * ser determinístico para ser comparado com o guardado.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function isWithinReuseGrace(revokedAt: Date): boolean {
  return differenceInSeconds(new Date(), revokedAt) < REUSE_GRACE_SECONDS
}

/**
 * O token guarda o cargo com que a pessoa entrou. Quem perdeu o privilégio
 * de administrador, ou teve o cargo trocado, precisa entrar de novo.
 */
function canStillSignInAs(user: User, role: string): boolean {
  if (role === 'ADVISOR_WITH_ADMIN_PRIVILEGES') {
    return user.role === 'ADVISOR' && user.has_admin_privileges
  }

  return user.role === role
}

function sessionExpired(): UnauthorizedException {
  return new UnauthorizedException(
    constants.exceptionMessages.auth.SESSION_EXPIRED
  )
}
