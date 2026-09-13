import { plainToInstance, Transform } from 'class-transformer'
import * as dotenv from 'dotenv'
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync
} from 'class-validator'

dotenv.config()

export enum EnvironmentEnum {
  DEV = 'development',
  PROD = 'production',
  TEST = 'test'
}

export enum Mode {
  DEV = 'dev',
  PROD = 'prod'
}

export class EnvironmentVariables {
  @IsEnum(EnvironmentEnum)
  @IsNotEmpty()
  NODE_ENV: EnvironmentEnum

  @IsEnum(Mode)
  @IsNotEmpty()
  MODE: Mode

  @IsNumber()
  @IsNotEmpty()
  PORT: number

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  DB_SYNCHRONIZE = false

  @IsString()
  @IsNotEmpty()
  CORS_ALLOWED_ORIGIN: string

  @IsString()
  @IsNotEmpty()
  API_KEY: string

  @IsString()
  @IsNotEmpty()
  APP_SECRET_KEY: string

  @IsNumber()
  @IsNotEmpty()
  APP_SECRET_KEY_EXPIRES_IN: number

  @IsString()
  @IsNotEmpty()
  EMAIL_HOST: string

  @IsNumber()
  @IsNotEmpty()
  EMAIL_PORT: number

  @IsString()
  @IsOptional()
  EMAIL_USER?: string

  @IsString()
  @IsOptional()
  EMAIL_PASSWORD?: string
}

export function validate(
  config: Record<string, unknown>
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: false
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: false
  })

  if (errors.length > 0) {
    const detalhes = errors
      .map(
        (error) =>
          `${error.property}: ${Object.values(error.constraints ?? {}).join(
            ', '
          )}`
      )
      .join('\n  ')

    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n  ${detalhes}`
    )
  }

  return validatedConfig
}

export const env: EnvironmentVariables = validate(process.env)
