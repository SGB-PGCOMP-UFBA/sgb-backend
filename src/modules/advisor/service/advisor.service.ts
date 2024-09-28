import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Advisor } from '../entities/advisor.entity'
import { comparePassword, hashPassword } from '../../../core/utils/bcrypt'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { UpdateAdvisorDto } from '../dto/update-advisor.dto'
import { constants } from '../../../core/utils/constants'
import { EmailService } from '../../../services/email-sending/service/email.service'

@Injectable()
export class AdvisorService {
  private readonly logger = new Logger(AdvisorService.name)

  constructor(
    private emailService: EmailService,
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

  async create(dto: CreateAdvisorDto) {
    this.logger.log(constants.exceptionMessages.advisor.CREATION_STARTED)

    try {
      const passwordHash = await hashPassword(dto.password)
      const newAdvisor = this.advisorRepository.create({
        ...dto,
        password: passwordHash
      })

      await this.advisorRepository.save(newAdvisor)
      this.logger.log(constants.exceptionMessages.advisor.CREATION_COMPLETED)

      if (dto.notify) {
        await this.emailService.sendEmail({
          to: newAdvisor.email,
          subject: 'Bem-vindo ao SGB-PGCOMP!',
          template: 'welcome-advisor',
          context: {
            newPassword: dto.password
          }
        })
      }

      return newAdvisor
    } catch (error) {
      this.logger.error(
        constants.exceptionMessages.advisor.CREATION_FAILED,
        error
      )
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
        tax_id: dto.tax_id,
        phone_number: dto.phone_number
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

  async updatePassword(
    email: string,
    current_password: string,
    new_password: string
  ): Promise<void> {
    const findAdvisor = await this.advisorRepository.findOne({
      where: { email }
    })

    if (!findAdvisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    const isPasswordMatching = await comparePassword(
      current_password,
      findAdvisor.password
    )

    if (!isPasswordMatching) {
      throw new BadRequestException(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
    }

    const passwordHash = await hashPassword(new_password)
    await this.advisorRepository.update({ email }, { password: passwordHash })
  }

  async resetPassword(email: string, password: string): Promise<void> {
    const findAdvisor = await this.advisorRepository.findOne({
      where: { email }
    })

    if (!findAdvisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    const passwordHash = await hashPassword(password)
    await this.advisorRepository.update({ email }, { password: passwordHash })
  }

  async delete(id: number) {
    const removed = await this.advisorRepository.delete(id)
    if (removed.affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
  }

  async grantAdminPrivileges(id: number) {
    const findAdvisor = await this.advisorRepository.findOne({
      where: { id }
    })

    if (!findAdvisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    await this.advisorRepository.update(
      { id },
      { has_admin_privileges: !findAdvisor.has_admin_privileges }
    )
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
