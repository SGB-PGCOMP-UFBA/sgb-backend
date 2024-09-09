import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  Param,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards
} from '@nestjs/common'
import { CreateStudentDto } from '../dto/create-student.dto'
import { StudentService } from '../service/student.service'
import { StudentMapper } from '../mapper/student.mapper'
import { UpdateStudentDto } from '../dto/update-student.dto'
import { UpdateStudentPasswordDto } from '../dto/update-student-password.dto'
import { Roles } from '../../../modules/auth/decorators/role.decorator'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'

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
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() dto: CreateStudentDto) {
    const student = await this.studentsService.create(dto)
    return StudentMapper.simplified(student)
  }

  @Patch()
  @Roles('STUDENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Body() dto: UpdateStudentDto) {
    const updatedStudent = await this.studentsService.update(dto)
    return StudentMapper.detailed(updatedStudent)
  }

  @Patch('/update-password')
  @Roles('STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePassword(@Body() dto: UpdateStudentPasswordDto) {
    return await this.studentsService.updatePassword(
      dto.email,
      dto.current_password,
      dto.new_password
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: string) {
    return await this.studentsService.delete(+id)
  }
}
