import { DataSource } from 'typeorm'
import { env } from '@/config/env.validation'

export const connectionSource = new DataSource({
  logging: false,
  synchronize: false,
  name: 'default',
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: ['dist/modules/**/**.entity{.ts,.js}'],
  migrations: ['dist/core/database/migrations/**/*{.ts,.js}'],
  subscribers: ['dist/core/database/migrations/**/*{.ts,.js}']
})
