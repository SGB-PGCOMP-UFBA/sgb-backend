import { Repository } from 'typeorm'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { hashPassword } from '../../../utils/bcrypt'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'
import { Admin } from '../entities/admin.entity'
import { toAdminResponseDto } from '../mapper/admin.mapper'

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

  async findOneByTaxId(tax_id: string) {
    const admin = await this.adminRepository.findOneBy({ tax_id })
    if (!admin) {
      throw new NotFoundException('Admin not found.')
    }
    
    return admin
  }

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminRepository.findOneBy({ id: id })
    if (!admin) throw new NotFoundException('Admin not found')

    const updated = await this.adminRepository.save({
      id: admin.id,
      name: updateAdminDto.name || admin.name,
      tax_id: admin.tax_id,
      email: updateAdminDto.email || admin.email,
      password: updateAdminDto.password
        ? await hashPassword(updateAdminDto.password)
        : admin.password
    })

    return toAdminResponseDto(updated)
  }

  async remove(id: number) {
    const removed = await this.adminRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException('Admin not found.')
  }
}
