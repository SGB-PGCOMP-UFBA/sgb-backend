import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { ResponseAgencyDto } from '../dto/response-agency.dto'
import { AgencyEntity, toAgencyResponseDto } from '../entities/agency.entity'

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(AgencyEntity)
    private agencyRepository: Repository<AgencyEntity>
  ) {}

  async create(createAgencyDto: CreateAgencyDto) {
    return this.agencyRepository.save(createAgencyDto)
  }

  async findAll(): Promise<ResponseAgencyDto[]> {
    const agencys = await this.agencyRepository.find()
    return agencys.map((agency) => toAgencyResponseDto(agency))
  }

  async findOne(id: number): Promise<ResponseAgencyDto> {
    const agency = await this.agencyRepository.findOne({
      relations: { scholarships: true },
      loadEagerRelations: true,
      where: {
        id: id
      }
    })
    if (!agency) throw new NotFoundException('Agency not found')
    return toAgencyResponseDto(agency)
  }

  async remove(id: number) {
    const removed = await this.agencyRepository.delete(id)
    if (removed.affected === 0) {
      throw new NotFoundException('Agency not found')
    }
    return 'Agency deleted'
  }
}

// import { Injectable, NotFoundException } from '@nestjs/common'
// import { InjectRepository } from '@nestjs/typeorm'
// import { ScholarshipService } from '../../scholarship/service/scholarship.service'
// import { Repository, Between } from 'typeorm'
// import { subYears } from 'date-fns'
// import { CreateAgencyDto } from '../dto/create-agency.dto'
// import { ResponseAgencyDto } from '../dto/response-agency.dto'
// import { AgencyEntity, toAgencyResponseDto } from '../entities/agency.entity'

// @Injectable()
// export class AgencyService {
//   constructor(
//     @InjectRepository(AgencyEntity)
//     private agencyRepository: Repository<AgencyEntity>,
//     private scholarshipService: ScholarshipService
//   ) {}

//   async create(createAgencyDto: CreateAgencyDto) {
//     return this.agencyRepository.save(createAgencyDto)
//   }

//   async findAll(): Promise<ResponseAgencyDto[]> {
//     const agencys = await this.agencyRepository.find({
//       relations: {
//         scholarships: true
//       }
//     })
//     return agencys.map((agency) => toAgencyResponseDto(agency))
//   }

//   async findAllWithNoExpiredScholarships(): Promise<ResponseAgencyDto[]> {
//     const BeforeDate = (date: Date) => Between(subYears(date, 100), date)

//     const agencys = await this.agencyRepository.find({
//       where: {
//         scholarship_ends_at: BeforeDate(new Date())
//       },
//       relations: {
//         scholarships: true
//       }
//     })

//     // const scholarships: Scholarship[] = await this.scholarshipRepository.find({
//     //   where: {
//     //     scholarship_ends_at: BeforeDate(new Date())
//     //   },
//     //   relations: {
//     //     student: true,
//     //     agency: true
//     //   }
//     // })

//     return agencys.map((agency) => toAgencyResponseDto(agency))
//   }

//   async findOne(id: number): Promise<ResponseAgencyDto> {
//     const agency = await this.agencyRepository.findOne({
//       relations: { scholarships: true },
//       loadEagerRelations: true,
//       where: {
//         id: id
//       }
//     })
//     if (!agency) throw new NotFoundException('Agency not found')
//     return toAgencyResponseDto(agency)
//   }

//   async findOneWithNoExpiredScholarships(
//     id: number
//   ): Promise<ResponseAgencyDto> {
//     const BeforeDate = (date: Date) => Between(subYears(date, 100), date)

//     // const scholarship = await this.scholarshipRepository.find({
//     //   where: {
//     //     id: id,
//     //     scholarship_ends_at: BeforeDate(new Date())
//     //   },
//     //   relations: {
//     //     student: true,
//     //     agency: true
//     //   }
//     // })

//     const agency = await this.agencyRepository.findOne({
//       relations: { scholarships: true },
//       loadEagerRelations: true,
//       where: {
//         id: id,
//         scholarship_ends_at: BeforeDate(new Date())
//       }
//     })
//     if (!agency) throw new NotFoundException('Agency not found')
//     return toAgencyResponseDto(agency)
//   }

//   async remove(id: number) {
//     const agency = await this.agencyRepository.findOne({
//       where: { id }
//     })
//     if (!agency) throw new NotFoundException('Agency not found')
//     const scholarships = await this.scholarshipService.findAllByAgencyId(id)
//     if (scholarships.length <= 0)
//       throw new NotFoundException('Scholarship not found')
//     for (const scholarship of scholarships) {
//       await this.scholarshipService.deleteById(scholarship.id)
//     }
//     await this.agencyRepository.delete(id)

//     return 'Agency deleted'
//   }
// }
