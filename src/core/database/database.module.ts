import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoLoadEntities: true,
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        ssl: configService.get('MODE') === 'prod',
        extra: {
          ssl:
            configService.get('MODE') === 'prod'
              ? { rejectUnauthorized: false }
              : false
        },
        entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
        synchronize: configService.get('MODE') === 'dev'
      })
    })
  ]
})
export class DatabaseModule {}
