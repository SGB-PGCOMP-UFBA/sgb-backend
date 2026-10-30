import {
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException
} from '@nestjs/common'
import { User } from '@/user/entities/user.entity'
import {
  UniqueUserField,
  UserRepository
} from '@/user/repositories/user.repository'
import { UserType } from '@/user/user-type.constant'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'

export interface NewUser {
  role: UserType
  name: string
  email: string
  /** Senha em texto puro; é guardada só como hash. */
  password: string
  tax_id?: string | null
  phone_number?: string | null
  link_to_lattes?: string | null
  has_admin_privileges?: boolean
}

export interface UserChanges {
  name?: string | null
  email?: string | null
  tax_id?: string | null
  phone_number?: string | null
  link_to_lattes?: string | null
}

const ALREADY_REGISTERED: Record<UniqueUserField, string> = {
  email: constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED,
  tax_id: constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED,
  phone_number:
    constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED,
  link_to_lattes:
    constants.negotialValidationMessages.LINK_TO_LATTES_ALREADY_REGISTERED
}

/** Pedido explícito para apagar o campo: `null` ou só espaços. */
function isCleared(value: string | null | undefined): boolean {
  return value === null || (typeof value === 'string' && value.trim() === '')
}

function emptyToNull(
  value: string | null | undefined
): string | null | undefined {
  return isCleared(value) ? null : value
}

function withoutUndefined<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}

const STUDENT_WELCOME = {
  owner_type: 'STUDENT',
  title: 'Bem-vindo ao SGB-PGCOMP',
  description:
    'Seja bem-vindo ao sistema de gestão de bolsas. Não se esqueça de finalizar o seu cadastro!'
}

/**
 * Criação e edição de cadastro, com as regras que valem venha o pedido do
 * próprio usuário ou de um administrador: dados únicos por tipo de usuário,
 * senha guardada como hash e campos que só existem para um tipo.
 */
@Injectable()
export class UserRecordsService {
  private readonly logger = new Logger(UserRecordsService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly embedNotificationRepository: EmbedNotificationRepository
  ) {}

  async register(data: NewUser): Promise<User> {
    await this.assertAvailable(data.role, data)

    const passwordHash = await hashPassword(data.password)
    const user = await this.userRepository.create({
      role: data.role,
      name: data.name,
      email: data.email,
      password: passwordHash,
      tax_id: data.tax_id ?? null,
      phone_number: data.phone_number ?? null,
      status: data.role === 'STUDENT' ? null : 'ACTIVE',
      link_to_lattes:
        data.role === 'STUDENT' ? data.link_to_lattes ?? null : null,
      has_admin_privileges:
        data.role === 'ADVISOR' && !!data.has_admin_privileges
    })

    if (user.role === 'STUDENT') {
      await this.welcomeStudent(user)
    }

    return user
  }

  /**
   * Edição parcial: campo ausente mantém o valor gravado; `null` ou texto
   * vazio apaga o campo quando ele é opcional e é recusado quando é
   * obrigatório (nome, e-mail e o CPF do estudante).
   */
  async update(user: User, changes: UserChanges): Promise<User> {
    this.assertRequiredKept(user.role, changes)
    await this.assertAvailable(user.role, changes, user.id)

    const data: Partial<User> = {
      name: changes.name ?? undefined,
      email: changes.email ?? undefined,
      tax_id: emptyToNull(changes.tax_id),
      phone_number: emptyToNull(changes.phone_number),
      link_to_lattes:
        user.role === 'STUDENT'
          ? emptyToNull(changes.link_to_lattes)
          : undefined
    }

    return await this.userRepository.update(user.id, withoutUndefined(data))
  }

  private assertRequiredKept(role: UserType, changes: UserChanges): void {
    if (isCleared(changes.name)) {
      throw new UnprocessableEntityException(
        constants.exceptionMessages.user.NAME_REQUIRED
      )
    }
    if (isCleared(changes.email)) {
      throw new UnprocessableEntityException(
        constants.exceptionMessages.user.EMAIL_REQUIRED
      )
    }
    if (role === 'STUDENT' && isCleared(changes.tax_id)) {
      throw new UnprocessableEntityException(
        constants.exceptionMessages.user.STUDENT_TAX_ID_REQUIRED
      )
    }
  }

  private async assertAvailable(
    type: UserType,
    fields: UserChanges,
    ownId?: number
  ): Promise<void> {
    for (const field of Object.keys(ALREADY_REGISTERED) as UniqueUserField[]) {
      const value = fields[field]

      if (!value) continue
      if (field === 'link_to_lattes' && type !== 'STUDENT') continue

      const owner = await this.userRepository.findByField(type, field, value)

      if (owner && owner.id !== ownId) {
        throw new ConflictException(ALREADY_REGISTERED[field])
      }
    }
  }

  /**
   * O cadastro já foi gravado; uma falha na notificação de boas-vindas não
   * deve desfazê-lo nem impedir o acesso.
   */
  private async welcomeStudent(student: User): Promise<void> {
    try {
      await this.embedNotificationRepository.create({
        ...STUDENT_WELCOME,
        owner_id: student.id
      })
    } catch (error) {
      this.logger.error(
        `Welcome notification failed for student ${student.id}`,
        error instanceof Error ? error.stack : String(error)
      )
    }
  }
}
