import { Module } from '@nestjs/common'
import { ArticleService } from './service/article.service'
import { ArticleController } from './controller/article.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ArticleEntity } from './entities/article.entity'
import { StudentEntity } from '../students/entities/students.entity'
import { StudentsModule } from '../students/students.module'
import { Advisor } from '../advisor/entities/advisor.entity'
import { AdvisorService } from '../advisor/service/advisor.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity, StudentEntity, Advisor]),
    StudentsModule
  ],
  controllers: [ArticleController],
  providers: [ArticleService, AdvisorService]
})
export class ArticleModule {}
