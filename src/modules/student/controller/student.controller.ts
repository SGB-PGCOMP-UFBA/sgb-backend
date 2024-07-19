import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  Param,
  HttpStatus
} from '@nestjs/common'
import { CreateStudentDto } from '../dto/create-student.dto'
import { StudentService } from '../service/student.service'
import { StudentMapper } from '../mapper/student.mapper'
import { UpdateStudentDto } from '../dto/update-student.dto'
import { UpdateStudentPasswordDto } from '../dto/update-student-password.dto'

@Controller('v1/student')
export class StudentController {
  constructor(private readonly studentsService: StudentService) {}

  @Get()
  async findAll() {
    const students = await this.studentsService.findAll()
    return students.map((student) => StudentMapper.detailed(student))
  }

  @Get(':email')
  async findByEmail(@Param('email') email: string) {
    const student = await this.studentsService.findByEmail(email, true)
    return StudentMapper.detailedWithFullRelations(student)
  }

  @Get('/by-advisor/:advisorId')
  async findAllByAdvisorId(@Param('advisorId') advisorId: number) {
    const students = await this.studentsService.findAllByAdvisorId(advisorId)
    return students.map((student) => StudentMapper.detailed(student))
  }

  @Post()
  async create(@Body() dto: CreateStudentDto) {
    const student = await this.studentsService.createStudent(dto)
    return StudentMapper.simplified(student)
  }

  @Post('/create-for-list')
  async createForList(@Body() listDto: CreateStudentDto[]) {
    let count = 0
    const promises = []

    listDto.forEach((dto) => {
      const promise = this.studentsService
        .createStudent(dto)
        .then((student) => {
          if (student.created_at) {
            count++
          }
        })

      promises.push(promise)
    })

    await Promise.all(promises)

    return `${count} - students created successfully!`
  }

  @Patch()
  async update(@Body() dto: UpdateStudentDto) {
    const updatedStudent = await this.studentsService.update(dto)
    return StudentMapper.detailed(updatedStudent)
  }

  @Patch('/update-password')
  async updatePassword(@Body() dto: UpdateStudentPasswordDto) {
    return await this.studentsService.updatePassword(
      dto.email,
      dto.current_password,
      dto.new_password
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.studentsService.delete(+id)
  }
}
