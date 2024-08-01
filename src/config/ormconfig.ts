import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
dotenv.config()

export const connectionSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: false,
  synchronize: false,
  name: 'default',
  entities: ['src/**/**.entity{.ts,.js}'],
  migrations: ['src/core/database/migrations/**/*{.ts,.js}'],
  subscribers: ['src/core/database/migrations/**/*{.ts,.js}']
})
