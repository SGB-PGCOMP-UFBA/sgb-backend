import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { Admin } from '@/admin/entities/admin.entity'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { constants } from '@/common/utils/constants'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { CreateAdminDto } from '@/admin/dtos/create-admin.dto'
import { UpdateAdminDto } from '@/admin/dtos/update-admin.dto'

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async create(key: string, dto: CreateAdminDto) {
    if (!constants.api.API_KEY || key !== constants.api.API_KEY) {
      throw new ForbiddenException()
    }

    try {
      const passwordHash = await hashPassword(dto.password)
      return await this.adminRepository.create({
        ...dto,
        password: passwordHash
      })
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.admin.CREATION_FAILED
      )
    }
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.findAllOrderedByName()
  }

  async update(dto: UpdateAdminDto) {
    const adminFromDatabase = await this.adminRepository.findByEmail(
      dto.current_email
    )
    if (!adminFromDatabase) {
      throw new NotFoundException(constants.exceptionMessages.admin.NOT_FOUND)
    }

    await this.validateUpdatingAdmin(dto, adminFromDatabase)

    try {
      return await this.adminRepository.update(adminFromDatabase.id, {
        name: dto.name || adminFromDatabase.name,
        email: dto.email || adminFromDatabase.email,
        tax_id: dto.tax_id,
        phone_number: dto.phone_number
      })
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.admin.UPDATE_FAILED
      )
    }
  }

  async resetPassword(email: string, password: string): Promise<void> {
    const findAdmin = await this.adminRepository.findByEmail(email)

    if (!findAdmin) {
      throw new NotFoundException(constants.exceptionMessages.admin.NOT_FOUND)
    }

    const passwordHash = await hashPassword(password)
    await this.adminRepository.updatePasswordByEmail(email, passwordHash)
  }

  async updatePassword(
    email: string,
    current_password: string,
    new_password: string
  ): Promise<void> {
    const findAdmin = await this.adminRepository.findByEmail(email)

    if (!findAdmin) {
      throw new NotFoundException(constants.exceptionMessages.admin.NOT_FOUND)
    }

    const isPasswordMatching = await comparePassword(
      current_password,
      findAdmin.password
    )

    if (!isPasswordMatching) {
      throw new BadRequestException(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
    }

    const passwordHash = await hashPassword(new_password)
    await this.adminRepository.updatePasswordByEmail(email, passwordHash)
  }

  async remove(id: number) {
    const affected = await this.adminRepository.deleteById(id)
    if (affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.admin.NOT_FOUND)
  }

  async validateUpdatingAdmin(dto: UpdateAdminDto, adminFromDatabase: Admin) {
    if (dto.tax_id && dto.tax_id !== adminFromDatabase.tax_id) {
      if (await this.adminRepository.findByTaxId(dto.tax_id)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
        )
      }
    }

    if (dto.email && dto.email !== adminFromDatabase.email) {
      if (await this.adminRepository.findByEmail(dto.email)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
        )
      }
    }

    if (
      dto.phone_number &&
      dto.phone_number !== adminFromDatabase.phone_number
    ) {
      if (await this.adminRepository.findByPhoneNumber(dto.phone_number)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
        )
      }
    }
  }
}
