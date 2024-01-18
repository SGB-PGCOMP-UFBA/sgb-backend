import { Module } from '@nestjs/common'
import { ArticleService } from './service/article.service'
import { ArticleController } from './controller/article.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Article } from './entities/article.entity'
import { Student } from '../student/entities/student.entity'
import { StudentModule } from '../student/student.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Student]),
    StudentModule
  ],
  controllers: [ArticleController],
  providers: [ArticleService]
})
export class ArticleModule {}
