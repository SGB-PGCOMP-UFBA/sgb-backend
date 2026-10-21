import { NotFoundException } from '@nestjs/common'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { constants } from '@/common/utils/constants'

const messages = constants.exceptionMessages.user

export async function findStudentByEmail(
  userRepository: UserRepository,
  email: string
): Promise<User> {
  const student = await userRepository.findByEmail(email, 'STUDENT')

  if (!student) {
    throw new NotFoundException(messages.STUDENT_NOT_FOUND)
  }

  return student
}

export async function findAdvisorByEmail(
  userRepository: UserRepository,
  email: string
): Promise<User> {
  const advisor = await userRepository.findByEmail(email, 'ADVISOR')

  if (!advisor) {
    throw new NotFoundException(messages.ADVISOR_NOT_FOUND)
  }

  return advisor
}
