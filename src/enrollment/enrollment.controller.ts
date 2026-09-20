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
import { EnrollmentService } from './enrollment.service'
import { EnrollmentMapper } from './enrollment.mapper'
import { CreateEnrollmentDto } from '@/enrollment/dtos/create-enrollment.dto'
import { UpdateEnrollmentDto } from '@/enrollment/dtos/update-enrollment.dto'
import { Roles } from '@/auth/role.decorator'
import { RolesGuard } from '@/auth/guards/roles.guard'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'

@Controller('v1/enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() dto: CreateEnrollmentDto) {
    const enrollment = await this.enrollmentService.create(dto)
    return EnrollmentMapper.simplified(enrollment)
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
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: number, @Body() dto: UpdateEnrollmentDto) {
    const updatedEnrollment = await this.enrollmentService.update(id, dto)
    return EnrollmentMapper.detailed(updatedEnrollment)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: number) {
    return await this.enrollmentService.delete(id)
  }
}
