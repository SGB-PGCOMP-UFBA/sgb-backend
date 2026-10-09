import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler()
    )

    if (!requiredRoles) {
      return true
    }

    if (requiredRoles.length === 0) {
      this.logger.warn('Rota com @Roles() sem cargos: acesso negado.')
      return false
    }

    const userRole = context.switchToHttp().getRequest().user?.role

    if (typeof userRole !== 'string') {
      this.logger.warn(
        'Requisição sem usuário autenticado chegou ao RolesGuard: acesso negado.'
      )
      return false
    }

    return requiredRoles.some((role) => role === userRole)
  }
}
