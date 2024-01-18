import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { Advisor } from '../entities/advisor.entity'
import { hashPassword } from '../../../utils/bcrypt'
import { toResponseAdvisorDTO } from '../mapper/advisor.mapper'

@Injectable()
export class AdvisorService {
  constructor(@InjectRepository(Advisor) private advisorRepository: Repository<Advisor>) {}

  async create(createAdvisorDto: CreateAdvisorDto) {
    try {
      const passwordHash = await hashPassword(createAdvisorDto.password)
      const advisor = this.advisorRepository.create({
        ...createAdvisorDto,
        password: passwordHash
      })

      await this.advisorRepository.save(advisor)

      return advisor
    } catch (error) {
      throw new BadRequestException("Can't create advisor.")
    }
  }

  async findAll(): Promise<Advisor[]> {
    return await this.advisorRepository.find()
  }

  async findOneById(id: number) {
    const advisor = await this.advisorRepository.findOneBy({ id })
    if (!advisor) throw new NotFoundException('Advisor not found.')
    return toResponseAdvisorDTO(advisor)
  }

  async findOneByEmail(email: string) {
    const advisor = await this.advisorRepository.findOneBy({ email })
    if (!advisor) throw new NotFoundException('Advisor not found.')
    return toResponseAdvisorDTO(advisor)
  }

  async findOneByTaxId(tax_id: string) {
    const advisor = await this.advisorRepository.findOneBy({ tax_id })
    if (!advisor) throw new NotFoundException('Advisor not found.')
    return toResponseAdvisorDTO(advisor)
  }

  async updatePassword(email: string, password: string) {
    const passwordHash = await hashPassword(password)
    await this.advisorRepository.update({ email }, { password: passwordHash })
  }

  async remove(id: number) {
    const removed = await this.advisorRepository.delete(id)
    if (removed.affected === 1) return

    throw new NotFoundException('Advisor not found')
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
