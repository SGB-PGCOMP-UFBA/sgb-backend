import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { ArticleService } from '../service/article.service'
import { CreateArticleDto } from '../dto/create-article.dto'
import { ArticleMapper } from '../mapper/article.mapper'

@Controller('v1/article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  async create(@Body() dto: CreateArticleDto) {
    const article = await this.articleService.create(dto)
    return ArticleMapper.simplified(article)
  }

  @Get()
  async findAll() {
    const articles = await this.articleService.findAll()
    return articles.map((article) => ArticleMapper.detailed(article))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articleService.remove(+id)
  }
}
