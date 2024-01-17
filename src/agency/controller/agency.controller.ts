import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { AgencyService } from '../service/agency.service'
@Controller('v1/agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post('/create')
  create(@Body() createAgencyDto: CreateAgencyDto) {
    return this.agencyService.create(createAgencyDto)
  }

  @Get('/findall')
  findAll() {
    return this.agencyService.findAll()
  }

  @Get('/findbyid/:id')
  findOne(@Param('id') id: string) {
    return this.agencyService.findOne(+id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agencyService.remove(+id)
  }
}
