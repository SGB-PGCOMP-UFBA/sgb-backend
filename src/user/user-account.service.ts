import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { UserRecordsService } from '@/user/user-records.service'
import { ManagedUser } from '@/user/managed-user.interface'
import { SignUpDto } from '@/user/dtos/sign-up.dto'
import { CreateAdminDto } from '@/user/dtos/create-admin.dto'
import { UpdateProfileDto } from '@/user/dtos/update-profile.dto'
import { UpdatePasswordDto } from '@/user/dtos/update-password.dto'
import { Caller } from '@/user/caller.interface'
import { callerIdOf } from '@/user/caller.util'
import { toManagedUser } from '@/user/user.mapper'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'

/** O que a pessoa faz com a própria conta, sem depender de um administrador. */
@Injectable()
export class UserAccountService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRecordsService: UserRecordsService
  ) {}

  async signUp(dto: SignUpDto): Promise<ManagedUser> {
    const student = await this.userRecordsService.register({
      ...dto,
      role: 'STUDENT'
    })

    return toManagedUser(student)
  }

  /** Protegida pela chave de API: é como o primeiro administrador entra. */
  async createAdmin(apiKey: string, dto: CreateAdminDto): Promise<ManagedUser> {
    if (!constants.api.API_KEY || apiKey !== constants.api.API_KEY) {
      throw new ForbiddenException()
    }

    const admin = await this.userRecordsService.register({
      ...dto,
      role: 'ADMIN'
    })

    return toManagedUser(admin)
  }

  async updateProfile(
    caller: Caller,
    dto: UpdateProfileDto
  ): Promise<ManagedUser> {
    await this.userRecordsService.update(await this.findCaller(caller), dto)

    return toManagedUser(await this.findCaller(caller))
  }

  async updatePassword(caller: Caller, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.findCaller(caller)

    if (!(await comparePassword(dto.current_password, user.password))) {
      throw new BadRequestException(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
    }

    await this.userRepository.updatePassword(
      user.id,
      await hashPassword(dto.new_password)
    )
  }

  private async findCaller(caller: Caller): Promise<User> {
    const user = await this.userRepository.findById(callerIdOf(caller))

    if (!user) {
      throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
    }

    return user
  }
}
