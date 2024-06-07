import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Advisor } from '../entities/advisor.entity'
import { hashPassword } from '../../../core/utils/bcrypt'
import { decidePassword } from '../../../core/utils/password'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { UpdateAdvisorDto } from '../dto/update-advisor.dto'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class AdvisorService {
  constructor(
    @InjectRepository(Advisor) private advisorRepository: Repository<Advisor>
  ) {}

  async findAll(): Promise<Advisor[]> {
    return await this.advisorRepository.find({
      relations: ['enrollments'],
      order: { name: 'ASC' }
    })
  }

  async findAllForFilter(): Promise<Advisor[]> {
    const advisors = await this.advisorRepository.find({
      order: { name: 'ASC' }
    })

    return advisors
  }

  async create(createAdvisorDto: CreateAdvisorDto) {
    try {
      const passwordHash = await hashPassword(decidePassword(createAdvisorDto))
      const newAdvisor = this.advisorRepository.create({
        ...createAdvisorDto,
        password: passwordHash
      })

      await this.advisorRepository.save(newAdvisor)

      return newAdvisor
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.advisor.CREATION_FAILED
      )
    }
  }

  async update(dto: UpdateAdvisorDto) {
    const advisorFromDatabase = await this.advisorRepository.findOneBy({
      email: dto.current_email
    })
    if (!advisorFromDatabase) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    await this.validateUpdatingAdvisor(dto, advisorFromDatabase)

    try {
      const updatedAdvisor = await this.advisorRepository.save({
        id: advisorFromDatabase.id,
        name: dto.name || advisorFromDatabase.name,
        email: dto.email || advisorFromDatabase.email,
        status: dto.status || advisorFromDatabase.status,
        tax_id: dto.tax_id || advisorFromDatabase.tax_id,
        phone_number: dto.phone_number || advisorFromDatabase.phone_number
      })

      return updatedAdvisor
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.advisor.UPDATE_FAILED
      )
    }
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

  async updatePassword(email: string, password: string): Promise<void> {
    const findAdvisor = await this.advisorRepository.findOne({
      where: { email }
    })

    if (!findAdvisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

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

  async validateUpdatingAdvisor(
    dto: UpdateAdvisorDto,
    advisorFromDatabase: Advisor
  ) {
    if (dto.tax_id && dto.tax_id !== advisorFromDatabase.tax_id) {
      const advisorFromTaxId = await this.advisorRepository.findOneBy({
        tax_id: dto.tax_id
      })
      if (advisorFromTaxId) {
        throw new BadRequestException(
          constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
        )
      }
    }

    if (dto.email && dto.email !== advisorFromDatabase.email) {
      const advisorFromEmail = await this.advisorRepository.findOneBy({
        email: dto.email
      })
      if (advisorFromEmail) {
        throw new BadRequestException(
          constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
        )
      }
    }

    if (
      dto.phone_number &&
      dto.phone_number !== advisorFromDatabase.phone_number
    ) {
      const advisorFromPhoneNumber = await this.advisorRepository.findOneBy({
        phone_number: dto.phone_number
      })
      if (advisorFromPhoneNumber) {
        throw new BadRequestException(
          constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
        )
      }
    }
  }
}
