import {
  Body,
  Controller,
  Get,
  Post,
  DefaultValuePipe,
  ParseIntPipe,
  Query
} from '@nestjs/common'
import { CreateStudentDto } from '../dto/create-student.dto'
import { StudentService } from '../service/student.service'
import { StudentMapper } from '../mapper/student.mapper'

@Controller('v1/student')
export class StudentController {
  constructor(private readonly studentsService: StudentService) {}

  @Post()
  async create(@Body() dto: CreateStudentDto) {
    const student = await this.studentsService.createStudent(dto)
    return StudentMapper.simplified(student)
  }

  @Get()
  async findAll() {
    const students = await this.studentsService.findAll()
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
}
