import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { Advisor } from '../entities/advisor.entity'
import { hashPassword } from '../../../core/utils/bcrypt'

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
      throw new BadRequestException("Can't create advisor.")
    }
  }

  async findOneById(id: number): Promise<Advisor> {
    const advisor = await this.advisorRepository.findOneBy({ id })
    if (!advisor) {
      throw new NotFoundException('Advisor not found.')
    }

    return advisor
  }

  async findOneByEmail(email: string): Promise<Advisor> {
    const advisor = await this.advisorRepository.findOneBy({ email })
    if (!advisor) {
      throw new NotFoundException('Advisor not found.')
    }

    return advisor
  }

  async findOneByTaxId(tax_id: string): Promise<Advisor> {
    const advisor = await this.advisorRepository.findOneBy({ tax_id })
    if (!advisor) {
      throw new NotFoundException('Advisor not found.')
    }

    return advisor
  }

  async updatePassword(email: string, password: string) {
    const passwordHash = await hashPassword(password)
    await this.advisorRepository.update({ email }, { password: passwordHash })
  }

  async delete(id: number) {
    const removed = await this.advisorRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException('Advisor not found.')
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
