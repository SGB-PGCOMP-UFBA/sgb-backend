import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { AuthService } from '@/auth/auth.service'
import { constants } from '@/common/utils/constants'
import {
  RefreshSession,
  RefreshTokenPayload
} from '@/auth/token-payload.interface'

const extractFromBody = ExtractJwt.fromBodyField('refresh_token')

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token'
) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: extractFromBody,
      ignoreExpiration: false,
      secretOrKey: constants.jwt.REFRESH_SECRET_KEY,
      passReqToCallback: true
    })
  }

  async validate(
    request: Request,
    payload: RefreshTokenPayload
  ): Promise<RefreshSession> {
    return await this.authService.validateRefreshToken(
      extractFromBody(request),
      payload
    )
  }
}
