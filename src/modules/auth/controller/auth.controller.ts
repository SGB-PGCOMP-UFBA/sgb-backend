import { Controller, Request, Post, UseGuards } from '@nestjs/common'
import { AuthService } from '@/modules/auth/service/auth.service'
import { LocalAuthGuard } from '@/modules/auth/guards/local-auth.guard'
import { AuthRequest } from '@/modules/auth/request/auth.request'

@Controller('/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post()
  async login(@Request() request: AuthRequest) {
    return this.authService.login(request.user)
  }
}
