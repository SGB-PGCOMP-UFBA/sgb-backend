import { ResponseArticleDTO } from '../../article/dto/response-article.dto'
import { ResponseStudentDTO } from '../../students/dto/student.response.dto'

export class TestUtil {
  static givenValidStudent() {
    const article = new ResponseArticleDTO(
      1,
      1,
      'title',
      new Date(),
      'publciation_place',
      'doi_link'
    )
    const student = new ResponseStudentDTO(
      1,
      '413431',
      '123456789',
      'John Doe',
      'email@gmail.com',
      'Computer Science',
      'https://lattes.cnpq.br/1234567890123456',
      1,
      new Date(),
      new Date(),
      '12345678901',
      'STUDENT',
      [article, article]
    )

    return student
  }
}
