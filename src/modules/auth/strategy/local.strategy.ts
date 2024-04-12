import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { ResponseUserDto } from '../../user/dtos/response-user.dto'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ passReqToCallback: true, usernameField: 'email' })
  }

  async validate(
    req: any,
    email: string,
    password: string
  ): Promise<ResponseUserDto> {
    const user = await this.authService.validateUser(
      email,
      password,
      req.body.role
    )
    return user
  }
}
