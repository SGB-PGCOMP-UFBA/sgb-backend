import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  HttpCode,
  Delete
} from '@nestjs/common'
import { CreateStudentDTO } from '../dto/student.dto.input'
import { ResponseStudentDTO } from '../dto/student.response.dto'
import { UpdateStudentDTO } from '../dto/update_student.dto'
import { ValidateInput } from '../dto/validate_data.input'
import { StudentsService } from '../service/students.service'

@Controller('v1/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('/not-paginate/list/all')
  async findAllStudents() {
    return await this.studentsService.findAllStudents()
  }

  @Get('/list/all')
  async paginate(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10
  ) {
    limit = limit > 100 ? 100 : limit
    return await this.studentsService.findAllStudentsPaginate({
      page,
      limit
    })
  }

  @Get('find/byid/:id')
  async findById(@Param('id') id: number) {
    return await this.studentsService.findById(id)
  }

  @Get('find/bycourse')
  async findByCourse(
    @Query('course') course: string
  ): Promise<ResponseStudentDTO[]> {
    return await this.studentsService.findByCourse(course)
  }

  @Get('find/byemail')
  async findByEmail(@Query('email') email: string) {
    return await this.studentsService.findByEmail(email)
  }

  @Get('/find/byadvisorid/:advisor_id')
  async findByAdvisorId(@Param('advisor_id') advisor_id: number) {
    return await this.studentsService.findByAdvisorId(advisor_id)
  }

  @Post()
  async createStudent(@Body() student: CreateStudentDTO) {
    return this.studentsService.createStudent(student)
  }

  @Patch()
  async updateStudent(@Body() student: UpdateStudentDTO) {
    return this.studentsService.updateStudent(student)
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteStudent(@Param('id') id: number) {
    return this.studentsService.deleteStudent(id)
  }

  @Get('/validate')
  @HttpCode(204)
  async validateInput(@Body() data: ValidateInput) {
    return await this.studentsService.validateInput(data)
  }
}
