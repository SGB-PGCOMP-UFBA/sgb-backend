import { Repository } from 'typeorm'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { hashPassword } from '../../../core/utils/bcrypt'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { Admin } from '../entities/admin.entity'

@Injectable()
export class AdminService {
  constructor(@InjectRepository(Admin) private adminRepository: Repository<Admin>) {}

  async create(createAdminDto: CreateAdminDto) {
    try{
      const passwordHash = await hashPassword(createAdminDto.password)
      const newAdmin = this.adminRepository.create({
        ...createAdminDto,
        password: passwordHash
      })
      
      await this.adminRepository.save(newAdmin)
      return newAdmin
    }
    catch(error) {
      throw new BadRequestException("Can't create admin.")
    }
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find()
  }

  async remove(id: number) {
    const removed = await this.adminRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException('Admin not found.')
  }
}
