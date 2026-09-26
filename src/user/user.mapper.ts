import { ResponseUserDto } from '@/user/dtos/response-user.dto'
import { User } from './user.interface'
import { ManagedUser } from '@/user/managed-user.interface'
import { Admin } from '@/admin/entities/admin.entity'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { Student } from '@/student/entities/student.entity'

export function toResponseUserDto(user: User): ResponseUserDto {
  return new ResponseUserDto(
    user.id,
    user.tax_id,
    user.name,
    user.role,
    user.email,
    user.phone_number
  )
}

export function toManagedStudent(student: Student): ManagedUser {
  return {
    ...managedUserBase(student),
    role: 'STUDENT',
    status: null,
    link_to_lattes: student.link_to_lattes || null
  }
}

export function toManagedAdvisor(advisor: Advisor): ManagedUser {
  return {
    ...managedUserBase(advisor),
    role: advisor.has_admin_privileges
      ? 'ADVISOR_WITH_ADMIN_PRIVILEGES'
      : 'ADVISOR',
    status: advisor.status,
    link_to_lattes: null
  }
}

export function toManagedAdmin(admin: Admin): ManagedUser {
  return {
    ...managedUserBase(admin),
    role: 'ADMIN',
    status: admin.status,
    link_to_lattes: null
  }
}

function managedUserBase(user: Student | Advisor | Admin) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    tax_id: user.tax_id || null,
    phone_number: user.phone_number || null,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
}
