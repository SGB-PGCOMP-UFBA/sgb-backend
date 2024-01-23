import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { AgencyService } from '../service/agency.service'
import { AgencyMapper } from '../mapper/agency.mapper'

@Controller('v1/agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  async create(@Body() dto: CreateAgencyDto) {
    const agency = await this.agencyService.create(dto)
    return AgencyMapper.simplified(agency)
  }

  @Get()
  async findAll() {
    const agencys = await this.agencyService.findAll()
    return agencys.map((agency) => AgencyMapper.detailed(agency))
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.agencyService.delete(+id)
  }
}
