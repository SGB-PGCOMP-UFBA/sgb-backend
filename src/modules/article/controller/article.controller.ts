import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { ArticleService } from '../service/article.service'
import { CreateArticleDto } from '../dto/create-article.dto'
import { toArticleResponseDto } from '../mapper/article.mapper'

@Controller('v1/article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articleService.create(createArticleDto)
  }

  @Get()
  async findAll() {
    const articles = await this.articleService.findAll()
    return articles.map((article) => toArticleResponseDto(article))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articleService.remove(+id)
  }
}
