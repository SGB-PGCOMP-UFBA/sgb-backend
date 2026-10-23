import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { UserRecordsService } from '@/user/user-records.service'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { EmailService } from '@/email/email.service'
import { constants } from '@/common/utils/constants'
import { generateTemporaryPassword } from '@/common/utils/password.util'
import { ManagedUser } from '@/user/managed-user.interface'
import { USER_ROLE_LABELS, UserRole } from '@/user/user-role.constant'
import { roleOf, userTypeOf } from '@/user/user-type.constant'
import { CreateManagedUserDto } from '@/user/dtos/create-managed-user.dto'
import { UpdateManagedUserDto } from '@/user/dtos/update-managed-user.dto'
import { UserStatus } from '@/user/dtos/update-managed-user-status.dto'
import { Caller } from '@/user/caller.interface'
import { isCaller } from '@/user/caller.util'
import { toManagedUser } from '@/user/user.mapper'

const messages = constants.exceptionMessages.user

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly userRecordsService: UserRecordsService,
    private readonly emailService: EmailService
  ) {}

  async findOne(id: number): Promise<ManagedUser> {
    return toManagedUser(await this.findUser(id))
  }

  async create(
    dto: CreateManagedUserDto,
    caller: Caller
  ): Promise<ManagedUser> {
    assertCanManage(dto.role, caller)

    const password = generateTemporaryPassword()
    const user = await this.userRecordsService.register({
      role: userTypeOf(dto.role),
      has_admin_privileges: dto.role === 'ADVISOR_WITH_ADMIN_PRIVILEGES',
      name: dto.name,
      email: dto.email,
      password,
      tax_id: dto.tax_id,
      phone_number: dto.phone_number,
      link_to_lattes: dto.link_to_lattes
    })

    try {
      await this.emailService.sendEmail(
        {
          to: dto.email,
          subject: 'Bem-vindo ao SGB-PGCOMP!',
          template: 'user-created',
          context: {
            name: dto.name,
            roleLabel: USER_ROLE_LABELS[dto.role],
            newPassword: password
          }
        },
        { throwOnError: true }
      )
    } catch (error) {
      this.logger.error(
        `Welcome e-mail failed, rolling back: ${dto.email}`,
        error instanceof Error ? error.stack : String(error)
      )
      await this.userRepository.deleteById(user.id)
      throw new InternalServerErrorException(messages.WELCOME_EMAIL_FAILED)
    }

    return toManagedUser(user)
  }

  async update(
    id: number,
    dto: UpdateManagedUserDto,
    caller: Caller
  ): Promise<ManagedUser> {
    const user = await this.findUser(id)
    assertCanManage(roleOf(user), caller)

    await this.userRecordsService.update(user, dto)

    return await this.findOne(id)
  }

  /** Situação só existe para orientador e administrador. */
  async updateStatus(
    id: number,
    status: UserStatus,
    caller: Caller
  ): Promise<ManagedUser> {
    const user = await this.findUser(id)
    assertCanManage(roleOf(user), caller)

    if (user.role === 'STUDENT') {
      throw new BadRequestException(messages.STUDENT_HAS_NO_STATUS)
    }

    if (isCaller(user, caller)) {
      throw new BadRequestException(messages.CANNOT_CHANGE_OWN_STATUS)
    }

    await this.userRepository.update(id, { status })

    return await this.findOne(id)
  }

  /** Liga o privilégio de administrador do orientador, ou desliga se já tiver. */
  async toggleAdminPrivileges(
    id: number,
    caller: Caller
  ): Promise<ManagedUser> {
    const user = await this.findUser(id)

    if (user.role !== 'ADVISOR') {
      throw new BadRequestException(
        messages.ONLY_ADVISORS_HAVE_ADMIN_PRIVILEGES
      )
    }

    if (isCaller(user, caller)) {
      throw new BadRequestException(messages.CANNOT_CHANGE_OWN_PRIVILEGES)
    }

    await this.userRepository.update(id, {
      has_admin_privileges: !user.has_admin_privileges
    })

    return await this.findOne(id)
  }

  async delete(id: number, caller: Caller): Promise<void> {
    const user = await this.findUser(id)
    assertCanManage(roleOf(user), caller)

    if (isCaller(user, caller)) {
      throw new BadRequestException(messages.CANNOT_DELETE_SELF)
    }

    await this.assertHasNoActiveScholarships(user)
    await this.userRepository.deleteById(id)
  }

  private async findUser(id: number): Promise<User> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new NotFoundException(messages.NOT_FOUND)
    }

    return user
  }

  private async assertHasNoActiveScholarships(user: User): Promise<void> {
    if (user.role === 'ADMIN') return

    const activeScholarships =
      await this.enrollmentRepository.countActiveScholarships(
        user.role === 'STUDENT'
          ? { student_id: user.id }
          : { advisor_id: user.id }
      )

    if (activeScholarships > 0) {
      throw new BadRequestException(
        hasActiveScholarshipsMessage(activeScholarships)
      )
    }
  }
}

function hasActiveScholarshipsMessage(count: number): string {
  const scholarships = count === 1 ? 'bolsa ativa' : 'bolsas ativas'

  return `Não é possível excluir: o usuário possui ${count} ${scholarships}.`
}

function assertCanManage(targetRole: UserRole, caller: Caller): void {
  if (targetRole === 'ADMIN' && caller.role !== 'ADMIN') {
    throw new ForbiddenException(messages.ONLY_ADMIN_MANAGES_ADMIN)
  }
}
