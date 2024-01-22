import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { ResponseUserDto } from '../../user/dtos/response-user.dto'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'tax_id' })
  }

  async validate(tax_id: string, password: string): Promise<ResponseUserDto> {
    const user = await this.authService.validateUser(tax_id, password)
    return user
  }
}
