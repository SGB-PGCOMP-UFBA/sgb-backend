import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { ResponseUserDTO } from '../../user/model/user.response.dto'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'tax_id' })
  }

  async validate(tax_id: string, password: string): Promise<ResponseUserDTO> {
    const user = await this.authService.validateUser(tax_id, password)
    return user
  }
}
