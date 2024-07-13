import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  HttpStatus,
  HttpCode,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Patch
} from '@nestjs/common'
import { ScholarshipService } from '../service/scholarship.service'
import { ScholarshipMapper } from '../mapper/scholarship.mapper'
import { ScholarshipFilters } from '../filters/IScholarshipFilters'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { UpdateScholarshipDto } from '../dto/update-scholarship.dto'

@Controller('v1/scholarship')
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post()
  async create(@Body() dto: CreateScholarshipDto) {
    const scholarship = await this.scholarshipService.create(dto)

    return ScholarshipMapper.simplified(scholarship)
  }

  @Post('/create-for-list')
  async createForList(@Body() listDto: CreateScholarshipDto[]) {
    let count = 0
    const promises = []

    listDto.forEach((dto) => {
      const promise = this.scholarshipService.create(dto).then(() => {
        count++
      })
      promises.push(promise)
    })

    await Promise.all(promises)

    return `${count} - scholarships created successfully!`
  }

  @Get('/paginated')
  async findAllPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query() filters?: ScholarshipFilters
  ) {
    page = page < 1 ? 1 : page
    limit = limit > 100 ? 100 : limit

    return await this.scholarshipService.findAllPaginated(
      { page, limit },
      filters
    )
  }

  @Get('/filter-list')
  async findAllForFilter() {
    const scholarships = await this.scholarshipService.findAllForFilter()
    return scholarships.map((scholarship) =>
      ScholarshipMapper.forFilter(scholarship)
    )
  }

  @Get('/count/by-agency-and-course')
  async countOnGoingScholarshipsGroupingByAgencyForCourse(
    @Query('programName') programName?: string
  ) {
    const resultCount =
      await this.scholarshipService.countOnGoingScholarshipsGroupingByAgencyForCourse(
        programName
      )

    return ScholarshipMapper.countOnGoingScholarshipsGroupingByAgencyForCourse(
      resultCount
    )
  }

  @Get('/count/by-course-and-year')
  async countScholarshipsGroupingByCourseAndYear() {
    const resultCount =
      await this.scholarshipService.countScholarshipsGroupingByCourseAndYear()

    return ScholarshipMapper.countScholarshipsGroupingByCourseAndYear(
      resultCount
    )
  }

  @Get('/count/by-agency-and-status')
  async countScholarshipsGroupingByStatusForAgency(
    @Query('agencyName') agencyName?: string
  ) {
    const resultCount =
      await this.scholarshipService.countScholarshipsGroupingByStatusForAgency(
        agencyName
      )

    return ScholarshipMapper.countScholarshipsGroupingByStatusForAgency(
      resultCount,
      agencyName
    )
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateScholarshipDto) {
    const updatedScholarship = await this.scholarshipService.update(id, dto)
    return ScholarshipMapper.detailed(updatedScholarship)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.scholarshipService.delete(+id)
  }
}
