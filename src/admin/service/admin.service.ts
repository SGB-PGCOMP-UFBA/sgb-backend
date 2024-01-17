import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { hashPassword } from '../../utils/bcrypt'
import { Repository } from 'typeorm'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { ResponseAdminDto, toAdminResponseDto } from '../dto/response-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'
import { Admin } from '../entities/admin.entity'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    const passwordHash = await hashPassword(createAdminDto.password)
    const newAdmin = await this.adminRepository.create({
      ...createAdminDto,
      password: passwordHash
    })
    await this.adminRepository.save(newAdmin)
    return toAdminResponseDto(newAdmin)
  }

  async findAll(): Promise<ResponseAdminDto[]> {
    try {
      const admins = await this.adminRepository.find()
      return admins.map((admin) => toAdminResponseDto(admin))
    } catch (error) {
      throw new BadRequestException('Error to find admins')
    }
  }

  async findOneByTaxId(tax_id: string) {
    const admin = await this.adminRepository.findOneBy({ tax_id })
    if (!admin) throw new NotFoundException('Admin not found')

    return toAdminResponseDto(admin)
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
    if (removed.affected === 1) return

    throw new NotFoundException('Admin not found')
  }
}
