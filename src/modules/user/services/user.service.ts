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

  async findUserByTaxId(tax_id: string): Promise<CreateUserDto> {
    try {
      const studentUser = await this.studentRepository.findOne({
        where: { tax_id }
      })
      const advisorUser = await this.advisorRepository.findOne({
        where: { tax_id }
      })
      const adminUser = await this.adminRepository.findOne({
        where: { tax_id }
      })

      let user = null
      if (advisorUser) {
        user = advisorUser
      } else if (studentUser) {
        user = studentUser
      } else if (adminUser) {
        user = adminUser
      }

      if (!user) {
        throw new NotFoundException(constants.exceptionMessages.user.NOT_FOUND)
      }

      return new CreateUserDto(user)
    } catch (error) {
      throw new NotFoundException(
        constants.exceptionMessages.user.SOMETHING_WRONG
      )
    }
  }
}
