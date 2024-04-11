import { Repository } from 'typeorm'
import { NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Student } from '../../student/entities/student.entity'
import { CreateUserDto } from '../dtos/create-user.dto'
import { Advisor } from '../../advisor/entities/advisor.entity'
import { Admin } from '../../admin/entities/admin.entity'
import { constants } from '../../../core/utils/constants'

export class UserService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Advisor)
    private advisorRepository: Repository<Advisor>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>
  ) {}

  async findUserByTaxIdAndRole(
    tax_id: string,
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

    const user = await userRepository.findOne({ where: { tax_id } })

    if (!user) {
      throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
    }

    return new CreateUserDto(user)
  }
}
