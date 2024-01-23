import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums'
import { HttpCode } from '@nestjs/common/decorators'
import { AdvisorService } from '../service/advisor.service'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { AdvisorMapper } from '../mapper/advisor.mapper'

@Controller('v1/advisor')
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Post()
  async create(@Body() dto: CreateAdvisorDto) {
    const advisor = await this.advisorService.create(dto)
    return AdvisorMapper.simplified(advisor)
  }

  @Get()
  async findAll() {
    const advisors = await this.advisorService.findAll()
    return advisors.map((advisor) => AdvisorMapper.detailed(advisor))
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.advisorService.delete(+id)
  }
}
