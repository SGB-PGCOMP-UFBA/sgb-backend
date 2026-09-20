import { EnvironmentEnum } from '@/config/env.validation'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'

const PERMITTED_ENVIRONMENTS = [EnvironmentEnum.DEV, EnvironmentEnum.TEST]

@Injectable()
export class EnvironmentGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const environment = this.configService
      .get<string>('NODE_ENV')
      ?.trim()
      ?.toLowerCase() as EnvironmentEnum

    return PERMITTED_ENVIRONMENTS.includes(environment)
  }
}
