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
    const repositoryMap = {
      ADMIN: this.adminRepository,
      ADVISOR: this.advisorRepository,
      STUDENT: this.studentRepository
    }

    const userRepository = repositoryMap[role]

    if (!userRepository) {
      throw new Error(constants.exceptionMessages.user.SOMETHING_WRONG)
    }

    const user = await userRepository.findOne({ where: { email } })

    if (!user) {
      this.logger.error(`User could not be authenticated: ${email}`)
      throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
    }

    this.logger.log(`User Authenticated: ${user.email}`)

    return new CreateUserDto(user)
  }
}
