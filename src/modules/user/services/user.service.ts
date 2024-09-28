import { Repository } from 'typeorm'
import { Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Student } from '../../student/entities/student.entity'
import { CreateUserDto } from '../dtos/create-user.dto'
import { Advisor } from '../../advisor/entities/advisor.entity'
import { Admin } from '../../admin/entities/admin.entity'
import { constants } from '../../../core/utils/constants'

export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Advisor)
    private advisorRepository: Repository<Advisor>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>
  ) {}

  async findUserByEmailAndRole(
    email: string,
    role: string
  ): Promise<CreateUserDto> {
    let user: Student | Advisor | Admin

    if (role === 'STUDENT') {
      user = await this.studentRepository.findOne({ where: { email } })
    } else if (role === 'ADVISOR') {
      user = await this.advisorRepository.findOne({ where: { email } })
    } else if (role === 'ADMIN') {
      user = await this.advisorRepository.findOne({
        where: { email, has_admin_privileges: true }
      })

      if (user) {
        user.role = 'ADVISOR_WITH_ADMIN_PRIVILEGES'
      } else {
        user = await this.adminRepository.findOne({ where: { email } })
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
