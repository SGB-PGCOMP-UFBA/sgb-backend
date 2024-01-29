import { Controller, Get, Post, Body, Param, Delete, Patch, HttpCode, HttpStatus } from '@nestjs/common'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { AgencyService } from '../service/agency.service'
import { AgencyMapper } from '../mapper/agency.mapper'
import { UpdateAgencyDto } from '../dto/update-agency.dto'

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

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateAgencyDto) {
    const updatedAgency = await this.agencyService.update(id, dto)
    
    return AgencyMapper.detailed(updatedAgency)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: number) {
    return await this.agencyService.delete(+id)
  }
}
