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
  ParseIntPipe
} from '@nestjs/common'
import { ScholarshipService } from '../service/scholarship.service'
import { CreateScholarshipDto } from '../dto/create-scholarship.dto'
import { ScholarshipMapper } from '../mapper/scholarship.mapper'
import { ScholarshipFilters } from '../filters/IScholarshipFilters'

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
    listDto.forEach(async (dto) => {
      await this.scholarshipService.create(dto)
    })

    return 'Created scholarships successfully!'
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.scholarshipService.delete(+id)
  }
}
