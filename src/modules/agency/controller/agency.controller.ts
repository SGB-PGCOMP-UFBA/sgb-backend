import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { AgencyService } from '../service/agency.service'
import { toAgencyResponseDto } from '../mapper/agency.mapper'

@Controller('v1/agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  async create(@Body() createAgencyDto: CreateAgencyDto) {
    const agency = await this.agencyService.create(createAgencyDto)
    return toAgencyResponseDto(agency)
  }

  @Get()
  async findAll() {
    const agencys = await this.agencyService.findAll()
    return agencys.map((agency) => toAgencyResponseDto(agency))
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.agencyService.remove(+id)
  }
}
