import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { AgencyEntity } from '../entities/agency.entity'
import { AgencyService } from './agency.service'

describe('AgencyService', () => {
  let service: AgencyService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgencyService,
        AgencyEntity,
        { provide: getRepositoryToken(AgencyEntity), useValue: {} }
      ]
    }).compile()

    service = module.get<AgencyService>(AgencyService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
