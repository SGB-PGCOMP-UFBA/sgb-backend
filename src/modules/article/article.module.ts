import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentModule } from '../student/student.module'
import { ArticleService } from './service/article.service'
import { ArticleController } from './controller/article.controller'
import { Article } from './entities/article.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Article]), StudentModule],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService]
})
export class ArticleModule {}
