import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { StudentRepository } from '@/student/repositories/student.repository'
import { Admin } from '@/admin/entities/admin.entity'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { Student } from '@/student/entities/student.entity'
import { CreateUserDto } from '@/user/dtos/create-user.dto'
import { constants } from '@/common/utils/constants'
import { FindUsersDto } from '@/user/dtos/find-users.dto'
import { ManagedUser } from '@/user/managed-user.interface'
import { UserRole } from '@/user/user-role.constant'
import {
  toManagedAdmin,
  toManagedAdvisor,
  toManagedStudent
} from '@/user/user.mapper'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly advisorRepository: AdvisorRepository,
    private readonly adminRepository: AdminRepository
  ) {}

  async findUserByEmailAndRole(
    email: string,
    role: string
  ): Promise<CreateUserDto> {
    let user: Student | Advisor | Admin

    if (role === 'STUDENT') {
      user = await this.studentRepository.findByEmail(email)
    } else if (role === 'ADVISOR') {
      user = await this.advisorRepository.findByEmail(email)
    } else if (role === 'ADMIN') {
      user = await this.advisorRepository.findByEmailAndAdminPrivileges(
        email,
        true
      )

      if (user) {
        user.role = 'ADVISOR_WITH_ADMIN_PRIVILEGES'
      } else {
        user = await this.adminRepository.findByEmail(email)
      }
    }

    if (!user) {
      this.logger.error(`User could not be authenticated: ${email}`)
      throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
    }

    this.logger.log(`User Authenticated: ${user.email}`)

    return new CreateUserDto(user)
  }

  /**
   * Os usuários vivem em três tabelas; por isso a consulta vai só às tabelas
   * do perfil pedido e junta o resultado aqui, ordenado pelo nome.
   */
  async findAll(filters: FindUsersDto = {}): Promise<ManagedUser[]> {
    const search = { name: filters.name, email: filters.email }
    const wants = (...roles: UserRole[]) =>
      !filters.role || roles.includes(filters.role)

    const [students, advisors, admins] = await Promise.all([
      wants('STUDENT') ? this.studentRepository.search(search) : [],
      wants('ADVISOR', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
        ? this.advisorRepository.search(search)
        : [],
      wants('ADMIN') ? this.adminRepository.search(search) : []
    ])

    return [
      ...students.map(toManagedStudent),
      ...advisors.map(toManagedAdvisor),
      ...admins.map(toManagedAdmin)
    ]
      .filter((user) => wants(user.role))
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
  }
}
