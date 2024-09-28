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
import { Roles } from '../../../modules/auth/decorators/role.decorator'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'

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
