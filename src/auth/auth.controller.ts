import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common'
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { LocalAuthGuard } from '@/auth/guards/local-auth.guard'
import { RefreshTokenGuard } from '@/auth/guards/refresh-token.guard'
import { AuthRequest, RefreshRequest } from './auth.request'

/**
 * Renovação e logout não recebem e-mail, então o limite por conta viraria um
 * contador por IP de 5 em 15 minutos, pequeno para uma rede da universidade.
 * Fica só o limite por IP.
 */
const ONLY_PER_IP_LIMIT = { 'per-account': true }

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Post('login')
  async login(@Request() request: AuthRequest) {
    return this.authService.login(request.user)
  }

  @SkipThrottle(ONLY_PER_IP_LIMIT)
  @UseGuards(ThrottlerGuard, RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login/refresh')
  async refresh(@Request() request: RefreshRequest) {
    return this.authService.refresh(request.user)
  }

  @SkipThrottle(ONLY_PER_IP_LIMIT)
  @UseGuards(ThrottlerGuard, RefreshTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Request() request: RefreshRequest): Promise<void> {
    await this.authService.logout(request.user)
  }
}
