import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Advisor } from '../entities/advisor.entity'
import { hashPassword } from '../../../core/utils/bcrypt'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { UpdateAdvisorDto } from '../dto/update-advisor.dto'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class AdvisorService {
  constructor(
    @InjectRepository(Advisor) private advisorRepository: Repository<Advisor>
  ) {}

  async findAll(): Promise<Advisor[]> {
    return await this.advisorRepository.find()
  }

  async create(createAdvisorDto: CreateAdvisorDto) {
    try {
      const passwordHash = await hashPassword(createAdvisorDto.password ?? createAdvisorDto.tax_id.replace(/[-.]/g,''))
      const newAdvisor = this.advisorRepository.create({
        ...createAdvisorDto,
        password: passwordHash
      })

      await this.advisorRepository.save(newAdvisor)

      return newAdvisor
    } catch (error) {
      throw new BadRequestException(constants.exceptionMessages.advisor.CREATION_FAILED)
    }
  }

  async update(id: number, dto: UpdateAdvisorDto) {
    const advisor = await this.advisorRepository.findOneBy({ id: id })
    if (!advisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    const updatedAdvisor = await this.advisorRepository.save({
      id: advisor.id,
      name: dto.name || advisor.name,
      email: dto.email || advisor.email,
      tax_id: dto.tax_id || advisor.tax_id,
      phone_number: dto.phone_number || advisor.phone_number,
    })

    return updatedAdvisor
  }

  async findOneById(id: number): Promise<Advisor> {
    const advisor = await this.advisorRepository.findOneBy({ id })
    if (!advisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    return advisor
  }

  async findOneByEmail(email: string): Promise<Advisor> {
    const advisor = await this.advisorRepository.findOneBy({ email })
    if (!advisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    return advisor
  }

  async findOneByTaxId(tax_id: string): Promise<Advisor> {
    const advisor = await this.advisorRepository.findOneBy({ tax_id })
    if (!advisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    return advisor
  }

  async updatePassword(email: string, password: string) {
    const passwordHash = await hashPassword(password)
    await this.advisorRepository.update({ email }, { password: passwordHash })
  }

  async resetPassword(email: string, password: string): Promise<void> {
    const findAdvisor = await this.advisorRepository.findOne({
      where: { email }
    })

    if (!findAdvisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    this.updatePassword(email, password)
  }

  async delete(id: number) {
    const removed = await this.advisorRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
  }

  async validateAdvisor(tax_id: string, email: string) {
    const advisorTax_id = await this.advisorRepository.findOneBy({ tax_id })
    if (advisorTax_id)
      throw new BadRequestException('Tax ID already registered')

    const advisor_email = await this.advisorRepository.findOneBy({ email })
    if (advisor_email) {
      throw new BadRequestException('Email already registered')
    }
  }
}
