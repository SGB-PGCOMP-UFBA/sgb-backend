import { Body, Controller, Get, Post, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common'
import { CreateStudentDto } from '../dto/create-student.dto'
import { StudentService } from '../service/student.service'
import { toResponseStudentDto } from '../mapper/student.mapper'
import { ResponseStudentDto } from '../dto/response-student.dto'

@Controller('v1/student')
export class StudentController {
  constructor(private readonly studentsService: StudentService) {}

  @Post()
  async create(@Body() createStudentDTO: CreateStudentDto): Promise<ResponseStudentDto> {
    const student = await this.studentsService.createStudent(createStudentDTO)
    return toResponseStudentDto(student)
  }

  @Get()
  async findAll() {
    const students = await this.studentsService.findAll()
    return students.map((student) => toResponseStudentDto(student))
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
