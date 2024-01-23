import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { EnrollmentService } from '../services/enrollment.service'
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto'
import { toResponseEnrollmentDto } from '../mappers/enrollment.mapper'

@Controller('v1/enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  async create(@Body() dto: CreateEnrollmentDto) {
    const enrollment = await this.enrollmentService.create(dto)
    return toResponseEnrollmentDto(enrollment)
  }

  @Get()
  async findAll() {
    const enrollments = await this.enrollmentService.findAll()
    return enrollments.map((enrollment) => toResponseEnrollmentDto(enrollment))
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.enrollmentService.delete(+id)
  }
}
