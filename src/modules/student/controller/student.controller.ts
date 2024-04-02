import {
  Body,
  Controller,
  Get,
  Post,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
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

@Controller('v1/student')
export class StudentController {
  constructor(private readonly studentsService: StudentService) {}

  @Get()
  async findAll() {
    const students = await this.studentsService.findAll()
    return students.map((student) => StudentMapper.detailed(student))
  }

  @Get('/by-advisor/:advisorId')
  async findAllByAdvisorId(@Param('advisorId') advisorId: number) {
    const students = await this.studentsService.findAllByAdvisorId(advisorId)
    return students.map((student) => StudentMapper.detailed(student))
  }

  @Get('/list')
  async finPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10
  ) {
    limit = limit > 100 ? 100 : limit
    return await this.studentsService.findAllPaginated({ page, limit })
  }

  @Post()
  async create(@Body() dto: CreateStudentDto) {
    const student = await this.studentsService.createStudent(dto)
    return StudentMapper.simplified(student)
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateStudentDto) {
    const updatedStudent = await this.studentsService.update(id, dto)
    return StudentMapper.detailed(updatedStudent)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.studentsService.delete(+id)
  }
}
