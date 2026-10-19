import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { comparePasswordOrDecoy } from '@/common/utils/bcrypt.util'
import { UserService } from '@/user/user.service'
import { ResponseUserDto } from '@/user/dtos/response-user.dto'
import { constants } from '@/common/utils/constants'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
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
    const payload = {
      authenticated_at: new Date().toISOString(),
      role: loggedUser.role,
      username: loggedUser.name,
      sub: `${loggedUser.id}-${loggedUser.role}`
    }

    return {
      access_token: this.jwtService.sign(payload),
      id: loggedUser.id,
      role: loggedUser.role,
      tax_id: loggedUser.tax_id,
      name: loggedUser.name,
      email: loggedUser.email,
      phone_number: loggedUser.phone_number
    }
  }
}
