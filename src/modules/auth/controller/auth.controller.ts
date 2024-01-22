import { Controller, Request, Post, UseGuards } from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { LocalAuthGuard } from '../guards/local-auth.guard'
import { AuthRequest } from '../request/auth.request'

@Controller('/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post()
  async login(@Request() request: AuthRequest) {
    return this.authService.login(request.user)
  }
}
