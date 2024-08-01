import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums'
import { HttpCode, Patch, UseGuards } from '@nestjs/common/decorators'
import { AdvisorService } from '../service/advisor.service'
import { AdvisorMapper } from '../mapper/advisor.mapper'
import { CreateAdvisorDto } from '../dto/create-advisor.dto'
import { UpdateAdvisorDto } from '../dto/update-advisor.dto'
import { UpdateAdvisorPasswordDto } from '../dto/update-advisor-password.dto'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { Roles } from '../../../modules/auth/decorators/role.decorator'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'

@Controller('v1/advisor')
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() dto: CreateAdvisorDto) {
    const advisor = await this.advisorService.create(dto)
    return AdvisorMapper.simplified(advisor)
  }

  @Post('/create-for-list')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createForList(@Body() listDto: CreateAdvisorDto[]) {
    let count = 0
    const promises = []

    listDto.forEach((dto) => {
      const promise = this.advisorService.create(dto).then((advisor) => {
        if (advisor.created_at) {
          count++
        }
      })

      promises.push(promise)
    })

    await Promise.all(promises)

    return `${count} - advisors created successfully!`
  }

  @Get()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    const advisors = await this.advisorService.findAll()
    return advisors.map((advisor) => AdvisorMapper.detailed(advisor))
  }

  @Get('/filter-list')
  @UseGuards(JwtAuthGuard)
  async findAllForFilter() {
    const advisors = await this.advisorService.findAllForFilter()
    return advisors.map((advisor) => AdvisorMapper.forFilter(advisor))
  }

  @Patch()
  @Roles('ADMIN', 'ADVISOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Body() dto: UpdateAdvisorDto) {
    const updatedAdvisor = await this.advisorService.update(dto)
    return AdvisorMapper.detailed(updatedAdvisor)
  }

  @Patch('/update-password')
  @Roles('ADMIN', 'ADVISOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePassword(@Body() dto: UpdateAdvisorPasswordDto) {
    return await this.advisorService.updatePassword(
      dto.email,
      dto.current_password,
      dto.new_password
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: string) {
    return await this.advisorService.delete(+id)
  }
}
