import { ResponseArticleDto } from "../dto/response-article.dto";
import { Article } from "../entities/article.entity";

export function toArticleResponseDto(article: Article): ResponseArticleDto {
    return new ResponseArticleDto(article)
}