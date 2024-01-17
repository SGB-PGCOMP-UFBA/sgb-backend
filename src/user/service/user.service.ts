import { InjectRepository } from '@nestjs/typeorm'
import { StudentEntity } from '../../students/entities/students.entity'
import { Repository } from 'typeorm'
import { CreateUserDTO } from '../model/user.dto.input'
import { NotFoundException } from '@nestjs/common'
import { errorMessages } from '../../auth/constants'
import { Advisor } from '../../advisor/entities/advisor.entity'
import { Admin } from '../../admin/entities/admin.entity'
export class UserService {
  constructor(
    @InjectRepository(StudentEntity)
    private studentRepository: Repository<StudentEntity>,
    @InjectRepository(Advisor)
    private advisorRepository: Repository<Advisor>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>
  ) {}

  async findUserByTaxId(tax_id: string): Promise<CreateUserDTO> {
    try {
      let user = null
      const studentUser = await this.studentRepository.findOne({
        where: { tax_id }
      })
      const advisorUser = await this.advisorRepository.findOne({
        where: { tax_id }
      })
      const adminUser = await this.adminRepository.findOne({
        where: { tax_id }
      })

      if (advisorUser) {
        user = advisorUser
      } else if (studentUser) {
        user = studentUser
      } else if (adminUser) {
        user = adminUser
      }

      if (user) return new CreateUserDTO(user)
      throw new NotFoundException(errorMessages.userNotFoundMessage)
    } catch (error) {
      throw new NotFoundException(errorMessages.userNotFoundMessage)
    }
  }
}
