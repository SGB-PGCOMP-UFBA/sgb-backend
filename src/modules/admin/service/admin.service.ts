import { Repository } from 'typeorm'
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { Admin } from '../entities/admin.entity'
import { constants } from '../../../core/utils/constants'
import { hashPassword } from '../../../core/utils/bcrypt'
import { decidePassword } from '../../../core/utils/password'

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
      throw new BadRequestException("Can't create admin.")
    }
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find({
      order: { name: 'ASC' }
    })
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

    throw new NotFoundException('Admin not found.')
  }
}
