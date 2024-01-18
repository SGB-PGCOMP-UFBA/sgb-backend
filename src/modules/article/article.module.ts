import { Module } from '@nestjs/common'
import { ArticleService } from './service/article.service'
import { ArticleController } from './controller/article.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Article } from './entities/article.entity'
import { Student } from '../student/entities/students.entity'
import { StudentModule } from '../student/students.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Student]),
    StudentModule
  ],
  controllers: [ArticleController],
  providers: [ArticleService]
})
export class ArticleModule {}
