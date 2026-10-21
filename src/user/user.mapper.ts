import { ResponseUserDto } from '@/user/dtos/response-user.dto'
import { ManagedUser } from '@/user/managed-user.interface'
import { User } from '@/user/entities/user.entity'
import { roleOf } from '@/user/user-type.constant'
import { EnrollmentMapper } from '@/enrollment/enrollment.mapper'

export function toResponseUserDto(user: User): ResponseUserDto {
  return new ResponseUserDto(
    user.id,
    user.tax_id,
    user.name,
    roleOf(user),
    user.email,
    user.phone_number
  )
}

export function toManagedUser(user: User): ManagedUser {
  const isStudent = user.role === 'STUDENT'

  return {
    id: user.id,
    role: roleOf(user),
    name: user.name,
    email: user.email,
    tax_id: user.tax_id || null,
    phone_number: user.phone_number || null,
    status: isStudent ? null : user.status,
    link_to_lattes: isStudent ? user.link_to_lattes || null : null,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
}

export function toAdvisorSummary(advisor: User) {
  return {
    id: advisor.id,
    role: roleOf(advisor),
    status: advisor.status,
    created_at: advisor.created_at,
    updated_at: advisor.updated_at,
    tax_id: advisor.tax_id || null,
    phone_number: advisor.phone_number || null,
    name: advisor.name,
    email: advisor.email,
    enrollmentsCount: advisor.advised_enrollments?.length ?? 0,
    has_admin_privileges: advisor.has_admin_privileges
  }
}

export function toAdvisorFilterOption(advisor: User) {
  return {
    id: advisor.id,
    key: advisor.name,
    value: advisor.name,
    email: advisor.email
  }
}

export function toStudentSummary(student: User) {
  return {
    id: student.id,
    role: student.role,
    created_at: student.created_at,
    updated_at: student.updated_at,
    name: student.name,
    email: student.email,
    link_to_lattes: student.link_to_lattes,
    tax_id: student.tax_id,
    phone_number: student.phone_number
  }
}

export function toStudentWithEnrollments(student: User) {
  return {
    ...toStudentSummary(student),
    enrollments: student.enrollments?.map((enrollment) =>
      EnrollmentMapper.detailedWithFullRelations(enrollment)
    )
  }
}
