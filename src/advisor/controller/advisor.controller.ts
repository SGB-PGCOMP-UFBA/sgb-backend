import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums'
import { HttpCode } from '@nestjs/common/decorators'
import { AdvisorService } from '../service/advisor.service'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { ResponseAdvisorDto } from '../dto/response-advisor.dto'
import { toResponseAdvisorDTO } from '../mapper/advisor.mapper'

@Controller('v1/advisor')
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Post()
  async create(@Body() createAdvisorDto: CreateAdvisorDto) {
    const advisor = await this.advisorService.create(createAdvisorDto)
    return toResponseAdvisorDTO(advisor)
  }

  @Get()
  async findAll() {
    const advisors = await this.advisorService.findAll()
    return advisors.map((advisor) => toResponseAdvisorDTO(advisor))
  }

  @Get('/find/byid/:id')
  async findOneById(@Param('id') id: string): Promise<ResponseAdvisorDto> {
    return await this.advisorService.findOneById(+id)
  }

  @Get('/find/byemail/:email')
  async findOneByEmail(@Param('email') email: string): Promise<ResponseAdvisorDto> {
    return await this.advisorService.findOneByEmail(email)
  }

  @Get('/find/bytaxid/:taxid')
  async findOneByTaxId(@Param('taxid') tax_id: string): Promise<ResponseAdvisorDto> {
    return await this.advisorService.findOneByTaxId(tax_id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.advisorService.remove(+id)
  }
}
