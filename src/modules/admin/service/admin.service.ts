import { Repository } from 'typeorm'
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Admin } from '../entities/admin.entity'
import { constants } from '../../../core/utils/constants'
import { hashPassword } from '../../../core/utils/bcrypt'
import { decidePassword } from '../../../core/utils/password'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    try {
      const passwordHash = await hashPassword(decidePassword(createAdminDto))
      const newAdmin = this.adminRepository.create({
        ...createAdminDto,
        password: passwordHash
      })

      await this.adminRepository.save(newAdmin)
      return newAdmin
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.admin.CREATION_FAILED
      )
    }
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find({
      order: { name: 'ASC' }
    })
  }

  async update(dto: UpdateAdminDto) {
    const adminFromDatabase = await this.adminRepository.findOneBy({
      email: dto.currentEmail
    })
    if (!adminFromDatabase) {
      throw new NotFoundException(constants.exceptionMessages.admin.NOT_FOUND)
    }

    await this.validateUpdatingAdmin(dto)

    try {
      const updatedAdmin = await this.adminRepository.save({
        id: adminFromDatabase.id,
        name: dto.name || adminFromDatabase.name,
        email: dto.email || adminFromDatabase.email,
        tax_id: dto.tax_id || adminFromDatabase.tax_id,
        phone_number: dto.phone_number || adminFromDatabase.phone_number
      })

      return updatedAdmin
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.admin.UPDATE_FAILED
      )
    }
  }

  async updatePassword(email: string, password: string): Promise<void> {
    const findAdmin = await this.adminRepository.findOne({
      where: { email }
    })

    if (!findAdmin) {
      throw new NotFoundException(constants.exceptionMessages.admin.NOT_FOUND)
    }

    const passwordHash = await hashPassword(password)
    await this.adminRepository.update({ email }, { password: passwordHash })
  }

  async remove(id: number) {
    const removed = await this.adminRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.admin.NOT_FOUND)
  }

  async validateUpdatingAdmin(dto: UpdateAdminDto) {
    if (dto.tax_id) {
      const adminFromTaxId = await this.adminRepository.findOneBy({
        tax_id: dto.tax_id
      })
      if (adminFromTaxId) {
        throw new BadRequestException(
          constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
        )
      }
    }

    if (dto.email) {
      const adminFromEmail = await this.adminRepository.findOneBy({
        email: dto.email
      })
      if (adminFromEmail) {
        throw new BadRequestException(
          constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
        )
      }
    }

    if (dto.phone_number) {
      const adminFromPhoneNumber = await this.adminRepository.findOneBy({
        phone_number: dto.phone_number
      })
      if (adminFromPhoneNumber) {
        throw new BadRequestException(
          constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
        )
      }
    }
  }
}
