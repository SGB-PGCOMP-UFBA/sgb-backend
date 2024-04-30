import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums'
import { HttpCode, Patch } from '@nestjs/common/decorators'
import { AdvisorService } from '../service/advisor.service'
import { AdvisorMapper } from '../mapper/advisor.mapper'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { UpdateAdvisorDto } from '../dto/update-advisor.dto'

@Controller('v1/advisor')
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Post()
  async create(@Body() dto: CreateAdvisorDto) {
    const advisor = await this.advisorService.create(dto)
    return AdvisorMapper.simplified(advisor)
  }

  @Post('/create-for-list')
  async createForList(@Body() listDto: CreateAdvisorDto[]) {
    listDto.forEach(async (dto) => {
      await this.advisorService.create(dto)
    })

    return 'Created advisors successfully!'
  }

  @Get()
  async findAll() {
    const advisors = await this.advisorService.findAll()
    return advisors.map((advisor) => AdvisorMapper.detailed(advisor))
  }

  @Get('/filter-list')
  async findAllForFilter() {
    const advisors = await this.advisorService.findAllForFilter()
    return advisors.map((advisor) => AdvisorMapper.forFilter(advisor))
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateAdvisorDto) {
    const updatedAdvisor = await this.advisorService.update(id, dto)
    return AdvisorMapper.detailed(updatedAdvisor)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.advisorService.delete(+id)
  }
}
