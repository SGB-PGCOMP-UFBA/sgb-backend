import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { CreateAdvisorDto } from '@/advisor/dtos/create-advisor.dto'
import { UpdateAdvisorDto } from '@/advisor/dtos/update-advisor.dto'
import { constants } from '@/common/utils/constants'
import { EmailService } from '@/email/email.service'

@Injectable()
export class AdvisorService {
  private readonly logger = new Logger(AdvisorService.name)

  constructor(
    private emailService: EmailService,
    private readonly advisorRepository: AdvisorRepository
  ) {}

  async findAll(): Promise<Advisor[]> {
    return await this.advisorRepository.findAllWithEnrollments()
  }

  async findAllForFilter(): Promise<Advisor[]> {
    return await this.advisorRepository.findAllForFilter()
  }

  async create(dto: CreateAdvisorDto) {
    this.logger.log(constants.exceptionMessages.advisor.CREATION_STARTED)

    try {
      const passwordHash = await hashPassword(dto.password)
      const newAdvisor = await this.advisorRepository.create({
        ...dto,
        password: passwordHash
      })
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
    const advisorFromDatabase = await this.advisorRepository.findByEmail(
      dto.current_email
    )
    if (!advisorFromDatabase) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    await this.validateUpdatingAdvisor(dto, advisorFromDatabase)

    try {
      return await this.advisorRepository.update(advisorFromDatabase.id, {
        name: dto.name || advisorFromDatabase.name,
        email: dto.email || advisorFromDatabase.email,
        status: dto.status || advisorFromDatabase.status,
        tax_id: dto.tax_id,
        phone_number: dto.phone_number
      })
    } catch (error) {
      throw new BadRequestException(
        constants.exceptionMessages.advisor.UPDATE_FAILED
      )
    }
  }

  async findOneById(id: number): Promise<Advisor> {
    const advisor = await this.advisorRepository.findById(id)
    if (!advisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    return advisor
  }

  async findOneByEmail(email: string): Promise<Advisor> {
    const advisor = await this.advisorRepository.findByEmail(email)
    if (!advisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    return advisor
  }

  async findOneByTaxId(tax_id: string): Promise<Advisor> {
    const advisor = await this.advisorRepository.findByTaxId(tax_id)
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
    const findAdvisor = await this.advisorRepository.findByEmail(email)

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
    await this.advisorRepository.updatePasswordByEmail(email, passwordHash)
  }

  async resetPassword(
    email: string,
    password: string,
    has_admin_privileges = false
  ): Promise<void> {
    const findAdvisor =
      await this.advisorRepository.findByEmailAndAdminPrivileges(
        email,
        has_admin_privileges
      )

    if (!findAdvisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    const passwordHash = await hashPassword(password)
    await this.advisorRepository.updatePasswordByEmail(email, passwordHash)
  }

  async delete(id: number) {
    const affected = await this.advisorRepository.deleteById(id)
    if (affected === 1) {
      return true
    }

    throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
  }

  async grantAdminPrivileges(id: number) {
    const findAdvisor = await this.advisorRepository.findById(id)

    if (!findAdvisor) {
      throw new NotFoundException(constants.exceptionMessages.advisor.NOT_FOUND)
    }

    await this.advisorRepository.setAdminPrivileges(
      id,
      !findAdvisor.has_admin_privileges
    )
  }

  async validateUpdatingAdvisor(
    dto: UpdateAdvisorDto,
    advisorFromDatabase: Advisor
  ) {
    if (dto.tax_id && dto.tax_id !== advisorFromDatabase.tax_id) {
      if (await this.advisorRepository.findByTaxId(dto.tax_id)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
        )
      }
    }

    if (dto.email && dto.email !== advisorFromDatabase.email) {
      if (await this.advisorRepository.findByEmail(dto.email)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
        )
      }
    }

    if (
      dto.phone_number &&
      dto.phone_number !== advisorFromDatabase.phone_number
    ) {
      if (await this.advisorRepository.findByPhoneNumber(dto.phone_number)) {
        throw new BadRequestException(
          constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
        )
      }
    }
  }
}
