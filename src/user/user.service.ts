import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { StudentRepository } from '@/student/repositories/student.repository'
import { Admin } from '@/admin/entities/admin.entity'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { Student } from '@/student/entities/student.entity'
import { CreateUserDto } from '@/user/dtos/create-user.dto'
import { constants } from '@/common/utils/constants'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly advisorRepository: AdvisorRepository,
    private readonly adminRepository: AdminRepository
  ) {}

  async findUserByEmailAndRole(
    email: string,
    role: string
  ): Promise<CreateUserDto> {
    let user: Student | Advisor | Admin

    if (role === 'STUDENT') {
      user = await this.studentRepository.findByEmail(email)
    } else if (role === 'ADVISOR') {
      user = await this.advisorRepository.findByEmail(email)
    } else if (role === 'ADMIN') {
      user = await this.advisorRepository.findByEmailAndAdminPrivileges(
        email,
        true
      )

      if (user) {
        user.role = 'ADVISOR_WITH_ADMIN_PRIVILEGES'
      } else {
        user = await this.adminRepository.findByEmail(email)
      }
    }

    if (!user) {
      this.logger.error(`User could not be authenticated: ${email}`)
      throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
    }

    this.logger.log(`User Authenticated: ${user.email}`)

    return new CreateUserDto(user)
  }
}
