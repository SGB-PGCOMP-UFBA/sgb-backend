import { DataSource } from 'typeorm'
import { env } from './env.validation'
import { APP_TIME_ZONE } from './time-zone.constant'

export const connectionSource = new DataSource({
  logging: false,
  synchronize: false,
  name: 'default',
  type: 'postgres',
  url: env.DATABASE_URL,
  extra: { options: `-c timezone=${APP_TIME_ZONE}` },
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/common/database/migrations/**/*{.ts,.js}'],
  subscribers: ['dist/common/database/migrations/**/*{.ts,.js}']
})
