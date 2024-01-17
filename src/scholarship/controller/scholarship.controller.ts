import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { ScholarshipService } from '../service/scholarship.service'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { NewFinalDateScholarshipDto } from '../dto/update-scholarship.dto'

@Controller('v1/scholarship')
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post()
  create(@Body() createScholarshipDto: CreateScholarshipDto) {
    return this.scholarshipService.create(createScholarshipDto)
  }

  @Get()
  findAll() {
    return this.scholarshipService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scholarshipService.findOneById(+id)
  }

  @Post('/:id/update/end')
  async updateFinalDateScholarship(
    @Param('id') id: number,
    @Body() newFinalDate: NewFinalDateScholarshipDto
  ) {
    return this.scholarshipService.updateFinalDateScholarship(newFinalDate, id)
  }

  @Get('/student/:id')
  findOneByStudentID(@Param('id') id: string) {
    return this.scholarshipService.findOneById(+id)
  }

  @Delete('/student/:id')
  deleteById(@Param('id') id: string) {
    return this.scholarshipService.deleteById(+id)
  }

  @Get('/findbyagency/:id')
  async findByAgency(@Param('id') id_agency: number) {
    return this.scholarshipService.findByAgencyAndModel(id_agency, '')
  }

  @Get('/findbyagency/:id/model/:model')
  async findByAgencyAndModel(
    @Param('id') id_agency: number,
    @Param('model') model: string
  ) {
    return this.scholarshipService.findByAgencyAndModel(id_agency, model)
  }
}
