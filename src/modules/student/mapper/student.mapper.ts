import { Student } from '../entities/student.entity'
import { ArticleMapper } from '../../article/mapper/article.mapper'
import { EnrollmentMapper } from '../../enrollment/mappers/enrollment.mapper'

export class StudentMapper {
  static simplified(student: Student) {
    return {
      id: student.id,
      role: student.role,
      created_at: student.created_at,
      updated_at: student.updated_at
    }
  }

  static detailed(student: Student) {
    const simplified = this.simplified(student)

    return {
      ...simplified,
      name: student.name,
      email: student.email,
      link_to_lattes: student.link_to_lattes,
      tax_id: student.tax_id,
      phone_number: student.phone_number
    }
  }

  static detailedWithRelations(student: Student) {
    const detailed = this.detailed(student)
    const articles = student.articles?.map((article) =>
      ArticleMapper.detailed(article)
    )
    const enrollments = student.enrollments?.map((enrollment) =>
      EnrollmentMapper.detailed(enrollment)
    )

    return {
      ...detailed,
      articles,
      enrollments
    }
  }
}
