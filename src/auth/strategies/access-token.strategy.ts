import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { constants } from '@/common/utils/constants'
import { AccessTokenPayload } from '@/auth/token-payload.interface'

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-token'
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: constants.jwt.SECRET_KEY
    })
  }

  /**
   * Tokens emitidos antes do refresh token não têm `type` e nunca expiravam:
   * recusá-los obriga um novo login, que já sai com o par de tokens.
   */
  async validate(payload: AccessTokenPayload) {
    if (payload?.type !== 'access') {
      throw new UnauthorizedException()
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role
    }
  }
}
