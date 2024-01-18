import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Agency } from '../entities/agency.entity'
import { AgencyService } from './agency.service'

describe('AgencyService', () => {
  let service: AgencyService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgencyService,
        Agency,
        { provide: getRepositoryToken(Agency), useValue: {} }
      ]
    }).compile()

    service = module.get<AgencyService>(AgencyService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
