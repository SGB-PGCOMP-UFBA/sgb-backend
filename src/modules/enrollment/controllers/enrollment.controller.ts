import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { EnrollmentService } from '../services/enrollment.service'
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto'
import { EnrollmentMapper } from '../mappers/enrollment.mapper'

@Controller('v1/enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  async create(@Body() dto: CreateEnrollmentDto) {
    const enrollment = await this.enrollmentService.create(dto)
    return EnrollmentMapper.simplified(enrollment)
  }

  @Post('/create-for-list')
  async createForList(@Body() listDto: CreateEnrollmentDto[]) {
    let count = 0
    const promises = []

    listDto.forEach((dto) => {
      const promise = this.enrollmentService.create(dto).then(() => {
        count++
      })
      promises.push(promise)
    })

    await Promise.all(promises)

    return `${count} - enrollments created successfully!`
  }

  @Get('/filter-list')
  async findAllForFilter() {
    const enrollments = await this.enrollmentService.findAllForFilter()
    return enrollments.map((enrollment) =>
      EnrollmentMapper.forFilter(enrollment)
    )
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.enrollmentService.delete(+id)
  }
}
