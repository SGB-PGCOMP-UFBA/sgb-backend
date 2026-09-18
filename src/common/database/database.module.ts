import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnvironmentEnum, env } from '@/config/env.validation'

const isProduction = env.NODE_ENV === EnvironmentEnum.PROD

@Module({
  imports: [
    TypeOrmModule.forRoot({
      autoLoadEntities: true,
      type: 'postgres',
      url: env.DATABASE_URL,
      ssl: isProduction,
      extra: {
        ssl: isProduction ? { rejectUnauthorized: false } : false
      },
      entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
      synchronize: env.DB_SYNCHRONIZE
    })
  ]
})
export class DatabaseModule {}
