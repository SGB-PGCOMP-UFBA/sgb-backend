import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Agency } from '../entities/agency.entity'
import { AgencyService } from '../service/agency.service'
import { AgencyController } from './agency.controller'

describe('AgencyController', () => {
  let controller: AgencyController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgencyController],
      providers: [
        AgencyService,
        { provide: getRepositoryToken(Agency), useValue: {} }
      ]
    }).compile()

    controller = module.get<AgencyController>(AgencyController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
