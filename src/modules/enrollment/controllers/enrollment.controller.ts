import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common'
import { EnrollmentService } from '../services/enrollment.service'
import { EnrollmentMapper } from '../mappers/enrollment.mapper'
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto'
import { UpdateEnrollmentDto } from '../dtos/update-enrollment.dto'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { Roles } from '../../../modules/auth/decorators/role.decorator'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'

@Controller('v1/enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() dto: CreateEnrollmentDto) {
    const enrollment = await this.enrollmentService.create(dto)
    return EnrollmentMapper.simplified(enrollment)
  }

  @Post('/create-for-list')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard)
  async findAllForFilter() {
    const enrollments = await this.enrollmentService.findAllForFilter()
    return enrollments.map((enrollment) =>
      EnrollmentMapper.forFilter(enrollment)
    )
  }

  @Patch(':id')
  @Roles('ADMIN', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: number, @Body() dto: UpdateEnrollmentDto) {
    const updatedEnrollment = await this.enrollmentService.update(id, dto)
    return EnrollmentMapper.detailed(updatedEnrollment)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: number) {
    return await this.enrollmentService.delete(id)
  }
}
