process.env.TZ = 'America/Sao_Paulo'

const ENV_DE_TESTE = {
  NODE_ENV: 'test',
  MODE: 'dev',
  PORT: '3333',
  DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/sgb_test',
  DB_SYNCHRONIZE: 'false',
  CORS_ALLOWED_ORIGIN: '*',
  API_KEY: 'chave-de-teste',
  APP_SECRET_KEY: 'segredo-de-teste',
  APP_SECRET_KEY_EXPIRES_IN: '3600',
  EMAIL_HOST: 'smtp.teste',
  EMAIL_PORT: '587'
}

for (const [chave, valor] of Object.entries(ENV_DE_TESTE)) {
  process.env[chave] = valor
}

import { Logger } from '@nestjs/common'

Logger.overrideLogger(false)
