import { Article } from "../entities/article.entity";
import { StudentMapper } from "../../student/mapper/student.mapper";

export class ArticleMapper {
    static simplified(article: Article) {
        return {
            id: article.id,
            student_id: article.student_id,
            created_at: article.created_at,
            updated_at: article.updated_at,
        }
    }
  
    static detailed(article: Article) {
        const simplified = this.simplified(article)

        return {
            ...simplified,
            title: article.title,
            abstract: article.abstract,
            publication_date: article.publication_date,
            publication_place: article.publication_place,
            doi_link: article.doi_link,
        }
    }

    static detailedWithRelations(article: Article) {
        const detailed = this.detailed(article)
        const student = article.student ? StudentMapper.detailed(article.student) : null

        return {
            ...detailed,
            student,
        }
    }
}