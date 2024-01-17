import { Test, TestingModule } from '@nestjs/testing'
import { HttpException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserService } from '../../user/service/user.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { StudentEntity } from '../../students/entities/students.entity'
import { JwtModule } from '@nestjs/jwt'
import { jwtConstants } from '../constants'
import { CreateStudentDTO } from '../../students/dto/student.dto.input'
import { NotFoundException } from '@nestjs/common'
import { Advisor } from '../../advisor/entities/advisor.entity'
import { Admin } from '../../admin/entities/admin.entity'

describe('User Login Service', () => {
  let authService: AuthService
  let userService: UserService

  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn()
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        AuthService,
        { provide: getRepositoryToken(Advisor), useValue: mockRepository },
        {
          provide: getRepositoryToken(StudentEntity),
          useValue: mockRepository
        },
        {
          provide: getRepositoryToken(Admin),
          useValue: mockRepository
        }
      ],
      imports: [
        JwtModule.register({
          secret: jwtConstants.secretKey,
          signOptions: { expiresIn: jwtConstants.expirationTime }
        })
      ]
    }).compile()
    authService = await moduleFixture.resolve(AuthService)
    userService = await moduleFixture.resolve(UserService)
  })

  beforeEach(() => {
    mockRepository.find.mockReset()
    mockRepository.findOneBy.mockReset()
    mockRepository.create.mockReset()
  })

  describe('Login Test', () => {
    it('Should return NotFoundException', async () => {
      const tax_id = '123131'
      await expect(userService.findUserByTaxId(tax_id)).rejects.toThrow(
        NotFoundException
      )
    })
  })

  it('Should return UnauthorizedException', async () => {
    const student = new CreateStudentDTO(
      '123456789',
      '12345678901',
      'John Doe',
      'johndoe@email.com',
      'Computer Science',
      'link.lates',
      1,
      new Date(),
      '999999999',
      '1234',
      'STUDENT',
      {
        student_id: 1,
        agency_id: 1,
        scholarship_starts_at: new Date(),
        scholarship_ends_at: new Date(),
        extension_ends_at: new Date(),
        salary: 1000,
        active: true,
        model: 'model'
      }
    )
    const user = '123456789'
    const password = '12341'
    mockRepository.create.mockResolvedValue(student)
    await expect(authService.validateUser(user, password)).rejects.toThrow(
      HttpException
    )
  })
})
