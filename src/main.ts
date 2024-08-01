import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './core/filters/HttpExceptionFilter'
import { CustomValidationException } from './core/exceptions/CustomValidationException'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'log', 'warn']
  })

  app.useGlobalFilters(new HttpExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new CustomValidationException(errors)
    })
  )

  app.enableCors({
    origin: '*'
  })

  await app.listen(process.env.PORT || 5001)
}
bootstrap()
