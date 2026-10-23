import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter'
import { CustomValidationException } from '@/common/exceptions/custom-validation.exception'
import { env } from '@/config/env.validation'
import { APP_TIME_ZONE } from '@/config/time-zone.constant'

process.env.TZ = APP_TIME_ZONE

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: ['error', 'log', 'warn']
  })

  app.set('trust proxy', env.TRUST_PROXY_HOPS)

  app.useGlobalFilters(new AllExceptionsFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new CustomValidationException(errors)
    })
  )

  app.enableCors({
    origin: env.CORS_ALLOWED_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-api-key'
  })

  await app.listen(env.PORT)
}
bootstrap()
