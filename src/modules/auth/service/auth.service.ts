import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { comparePassword } from '../../../core/utils/bcrypt'
import { UserService } from '../../user/services/user.service'
import { ResponseUserDto } from '../../user/dtos/response-user.dto'
import { constants } from '../../../core/utils/constants'

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
    if (!user) {
      throw new HttpException(
        constants.exceptionMessages.user.NOT_FOUND,
        HttpStatus.NOT_FOUND
      )
    }

    const validPassword = await comparePassword(passwordInserted, user.password)
    if (!validPassword) {
      throw new HttpException(
        constants.exceptionMessages.user.WRONG_PASSWORD,
        HttpStatus.UNAUTHORIZED
      )
    }

    return new ResponseUserDto(
      user.id,
      user.tax_id,
      user.name,
      user.role,
      user.email
    )
  }

  async login(loggedUser: ResponseUserDto) {
    const payload = {
      username: loggedUser.name,
      sub: loggedUser.id
    }

    return {
      access_token: this.jwtService.sign(payload),
      id: loggedUser.id,
      role: loggedUser.role,
      tax_id: loggedUser.tax_id,
      name: loggedUser.name,
      email: loggedUser.email
    }
  }
}
