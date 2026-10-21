import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { CreateUserDto } from '@/user/dtos/create-user.dto'
import { FindUsersDto } from '@/user/dtos/find-users.dto'
import { ManagedUser } from '@/user/managed-user.interface'
import { UserRole } from '@/user/user-role.constant'
import { userTypeOf } from '@/user/user-type.constant'
import { Caller } from '@/user/caller.interface'
import { callerIdOf, isCaller } from '@/user/caller.util'
import {
  toAdvisorFilterOption,
  toAdvisorSummary,
  toManagedUser,
  toStudentWithEnrollments
} from '@/user/user.mapper'
import { constants } from '@/common/utils/constants'

const messages = constants.exceptionMessages.user

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Entrar como ADMIN vale para administradores e para orientadores com
   * privilégio de administrador; o orientador tem precedência, como antes da
   * unificação das tabelas.
   */
  async findUserByEmailAndRole(
    email: string,
    role: string
  ): Promise<CreateUserDto | null> {
    const [user, loginRole] = await this.findLoginAccount(email, role)

    if (!user) {
      this.logger.warn(`Login attempt for unknown account: ${email}`)
      return null
    }

    return new CreateUserDto(user, loginRole)
  }

  /** Quem faz a chamada fica de fora: a própria conta é gerida em Configurações. */
  async findAll(
    filters: FindUsersDto = {},
    caller?: Caller
  ): Promise<ManagedUser[]> {
    const users = await this.userRepository.search(
      { name: filters.name, email: filters.email },
      filters.role ? userTypeOf(filters.role) : undefined
    )

    return users
      .map(toManagedUser)
      .filter((user) => !filters.role || user.role === filters.role)
      .filter((user) => !caller || !isCaller(user, caller))
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
  }

  async findAdvisors() {
    const advisors = await this.userRepository.findAdvisorsWithEnrollments()
    return advisors.map(toAdvisorSummary)
  }

  async findAdvisorsForFilter() {
    const advisors = await this.userRepository.findAllByType('ADVISOR')
    return advisors.map(toAdvisorFilterOption)
  }

  /** O estudante só vê a si mesmo; administradores veem qualquer um. */
  async findStudent(id: number, caller: Caller) {
    if (caller.role === 'STUDENT') {
      assertIsCaller(id, caller)
    }

    const student = await this.userRepository.findStudentWithEnrollments(id)

    if (!student) {
      throw new NotFoundException(messages.STUDENT_NOT_FOUND)
    }

    return toStudentWithEnrollments(student)
  }

  /** O orientador só vê os próprios orientandos. */
  async findStudentsByAdvisor(advisorId: number, caller: Caller) {
    if (caller.role === 'ADVISOR') {
      assertIsCaller(advisorId, caller)
    }

    const students = await this.userRepository.findStudentsByAdvisorId(
      advisorId
    )

    return students.map(toStudentWithEnrollments)
  }

  private async findLoginAccount(
    email: string,
    role: string
  ): Promise<[User | null, UserRole]> {
    switch (role) {
      case 'STUDENT':
        return [await this.userRepository.findByEmail(email, 'STUDENT'), role]
      case 'ADVISOR':
        return [await this.userRepository.findByEmail(email, 'ADVISOR'), role]
      case 'ADMIN': {
        const advisor =
          await this.userRepository.findAdvisorWithAdminPrivilegesByEmail(email)

        if (advisor) return [advisor, 'ADVISOR_WITH_ADMIN_PRIVILEGES']

        return [await this.userRepository.findByEmail(email, 'ADMIN'), role]
      }
      default:
        return [null, null]
    }
  }
}

function assertIsCaller(id: number, caller: Caller): void {
  if (callerIdOf(caller) !== id) {
    throw new ForbiddenException(messages.ONLY_OWN_DATA)
  }
}
