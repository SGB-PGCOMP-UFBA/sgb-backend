import { Controller, Get, Post, Body, Delete, Param, HttpStatus, HttpCode } from '@nestjs/common'
import { ScholarshipService } from '../service/scholarship.service'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { ScholarshipMapper } from '../mapper/scholarship.mapper'

@Controller('v1/scholarship')
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post()
  async create(@Body() dto: CreateScholarshipDto) {
    const scholarship = await this.scholarshipService.create(dto)
    
    return ScholarshipMapper.simplified(scholarship)
  }

  @Get()
  async findAll() {
    const scholarships = await this.scholarshipService.findAll()

    return scholarships.map((scholarship) => ScholarshipMapper.detailed(scholarship))
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.scholarshipService.delete(+id)
  }
}
