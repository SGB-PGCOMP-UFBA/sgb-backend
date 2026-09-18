import { DataSource } from 'typeorm'
import { env } from './env.validation'

export const connectionSource = new DataSource({
  logging: false,
  synchronize: false,
  name: 'default',
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/common/database/migrations/**/*{.ts,.js}'],
  subscribers: ['dist/common/database/migrations/**/*{.ts,.js}']
})
