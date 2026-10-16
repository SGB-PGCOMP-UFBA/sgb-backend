import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { AdminService } from '@/admin/admin.service'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { AdvisorService } from '@/advisor/advisor.service'
import { StudentRepository } from '@/student/repositories/student.repository'
import { StudentService } from '@/student/student.service'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { EmailService } from '@/email/email.service'
import { constants } from '@/common/utils/constants'
import { generateTemporaryPassword } from '@/common/utils/password.util'
import { ManagedUser } from '@/user/managed-user.interface'
import { USER_ROLE_LABELS, UserRole } from '@/user/user-role.constant'
import { CreateManagedUserDto } from '@/user/dtos/create-managed-user.dto'
import { UpdateManagedUserDto } from '@/user/dtos/update-managed-user.dto'
import {
  toManagedAdmin,
  toManagedAdvisor,
  toManagedStudent
} from '@/user/user.mapper'

type UserTable = 'STUDENT' | 'ADVISOR' | 'ADMIN'

export interface Caller {
  userId: string
  role: string
}

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name)

  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly advisorRepository: AdvisorRepository,
    private readonly adminRepository: AdminRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly studentService: StudentService,
    private readonly advisorService: AdvisorService,
    private readonly adminService: AdminService,
    private readonly emailService: EmailService
  ) {}

  async findOne(role: UserRole, id: number): Promise<ManagedUser> {
    const user = await this.findManagedUser(tableOf(role), id)

    if (!user) {
      throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
    }

    return user
  }

  async create(
    dto: CreateManagedUserDto,
    caller: Caller
  ): Promise<ManagedUser> {
    assertCanManage(dto.role, caller)

    const password = generateTemporaryPassword()
    const table = tableOf(dto.role)
    const id = await this.register(dto, password)

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
      this.logger.error(`Welcome e-mail failed, rolling back: ${dto.email}`)
      await this.deleteFromTable(table, id)
      throw new InternalServerErrorException(
        constants.exceptionMessages.user.WELCOME_EMAIL_FAILED
      )
    }

    return await this.findOne(dto.role, id)
  }

  async update(
    role: UserRole,
    id: number,
    dto: UpdateManagedUserDto,
    caller: Caller
  ): Promise<ManagedUser> {
    const user = await this.findOne(role, id)
    assertCanManage(user.role, caller)

    const common = {
      current_email: user.email,
      name: dto.name,
      email: dto.email,
      tax_id: dto.tax_id,
      phone_number: dto.phone_number
    }

    switch (tableOf(user.role)) {
      case 'STUDENT':
        await this.studentService.update({
          ...common,
          link_to_lattes: dto.link_to_lattes
        })
        break
      case 'ADVISOR':
        await this.advisorService.update({ ...common, status: dto.status })
        break
      case 'ADMIN':
        await this.adminService.update(common)
        break
    }

    return await this.findOne(role, id)
  }

  async delete(role: UserRole, id: number, caller: Caller): Promise<void> {
    const user = await this.findOne(role, id)
    assertCanManage(user.role, caller)

    const table = tableOf(user.role)

    if (isSameUser(table, id, caller)) {
      throw new BadRequestException(
        constants.exceptionMessages.user.CANNOT_DELETE_SELF
      )
    }

    await this.assertHasNoActiveScholarships(table, id)
    await this.deleteFromTable(table, id)
  }

  private async register(
    dto: CreateManagedUserDto,
    password: string
  ): Promise<number> {
    const common = {
      name: dto.name,
      email: dto.email,
      password,
      tax_id: dto.tax_id,
      phone_number: dto.phone_number
    }

    switch (dto.role) {
      case 'STUDENT': {
        const student = await this.studentService.create({
          ...common,
          link_to_lattes: dto.link_to_lattes
        })
        return student.id
      }
      case 'ADVISOR':
      case 'ADVISOR_WITH_ADMIN_PRIVILEGES': {
        const advisor = await this.advisorService.create({
          ...common,
          status: dto.status ?? 'ACTIVE',
          notify: false
        })

        if (dto.role === 'ADVISOR_WITH_ADMIN_PRIVILEGES') {
          await this.advisorRepository.setAdminPrivileges(advisor.id, true)
        }

        return advisor.id
      }
      case 'ADMIN': {
        const admin = await this.adminService.register(common)
        return admin.id
      }
    }
  }

  private async assertHasNoActiveScholarships(
    table: UserTable,
    id: number
  ): Promise<void> {
    if (table === 'ADMIN') return

    const activeScholarships =
      await this.enrollmentRepository.countActiveScholarships(
        table === 'STUDENT' ? { student_id: id } : { advisor_id: id }
      )

    if (activeScholarships > 0) {
      throw new BadRequestException(
        hasActiveScholarshipsMessage(activeScholarships)
      )
    }
  }

  private async findManagedUser(
    table: UserTable,
    id: number
  ): Promise<ManagedUser | null> {
    switch (table) {
      case 'STUDENT': {
        const student = await this.studentRepository.findById(id)
        return student && toManagedStudent(student)
      }
      case 'ADVISOR': {
        const advisor = await this.advisorRepository.findById(id)
        return advisor && toManagedAdvisor(advisor)
      }
      case 'ADMIN': {
        const admin = await this.adminRepository.findById(id)
        return admin && toManagedAdmin(admin)
      }
    }
  }

  private async deleteFromTable(table: UserTable, id: number): Promise<void> {
    switch (table) {
      case 'STUDENT':
        await this.studentRepository.deleteById(id)
        return
      case 'ADVISOR':
        await this.advisorRepository.deleteById(id)
        return
      case 'ADMIN':
        await this.adminRepository.deleteById(id)
        return
    }
  }
}

function hasActiveScholarshipsMessage(count: number): string {
  const scholarships = count === 1 ? 'bolsa ativa' : 'bolsas ativas'

  return `Não é possível excluir: o usuário possui ${count} ${scholarships}.`
}

function tableOf(role: UserRole): UserTable {
  return role === 'ADVISOR_WITH_ADMIN_PRIVILEGES' ? 'ADVISOR' : role
}

function assertCanManage(targetRole: UserRole, caller: Caller): void {
  if (targetRole === 'ADMIN' && caller.role !== 'ADMIN') {
    throw new ForbiddenException(
      constants.exceptionMessages.user.ONLY_ADMIN_MANAGES_ADMIN
    )
  }
}

function isSameUser(table: UserTable, id: number, caller: Caller): boolean {
  const [callerId, callerRole] = caller.userId.split(/-(.+)/)

  return Number(callerId) === id && tableOf(callerRole as UserRole) === table
}
