import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateArticleDto } from '../dto/create-article.dto'
import { Article } from '../entities/article.entity'
import { StudentService } from '../../student/service/student.service'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    private studentService: StudentService
  ) {}

  async create(createArticleDto: CreateArticleDto) {
    try {
      const newArticle = this.articleRepository.create({ ...createArticleDto })

      await this.articleRepository.save(newArticle)

      return newArticle
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.article.CREATION_FAILED
      )
    }
  }

  async findAll(): Promise<Article[]> {
    return await this.articleRepository.find()
  }

  async remove(id: number) {
    const removed = await this.articleRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.article.NOT_FOUND)
  }
}
