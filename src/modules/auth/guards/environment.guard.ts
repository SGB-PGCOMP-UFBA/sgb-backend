import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'

@Injectable()
export class EnvironmentGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production'

    return !isProduction
  }
}
