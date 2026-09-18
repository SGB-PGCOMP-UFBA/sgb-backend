import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  ValidateNested,
  Min,
  IsObject
} from 'class-validator'
import { Type } from 'class-transformer'

class DegreeCountDto {
  @IsNumber()
  @Min(0)
  masters: number

  @IsNumber()
  @Min(0)
  phd: number
}

class AgencyReportDto {
  @IsString()
  @IsNotEmpty()
  agencyName: string

  @IsNumber()
  @Min(0)
  scholarshipsTotal: number

  @IsNumber()
  @Min(0)
  totalMasters: number

  @IsNumber()
  @Min(0)
  totalPhd: number

  @IsObject()
  @ValidateNested()
  @Type(() => DegreeCountDto)
  activeCount: DegreeCountDto

  @IsObject()
  @ValidateNested()
  @Type(() => DegreeCountDto)
  inactiveCount: DegreeCountDto

  @IsObject()
  @ValidateNested()
  @Type(() => DegreeCountDto)
  finishedCount: DegreeCountDto

  @IsObject()
  @ValidateNested()
  @Type(() => DegreeCountDto)
  onGoingCount: DegreeCountDto

  @IsObject()
  @ValidateNested()
  @Type(() => DegreeCountDto)
  extendedCount: DegreeCountDto
}

export class QuadrennialReportDto {
  @IsString()
  @IsNotEmpty()
  startDate: string

  @IsString()
  @IsNotEmpty()
  endDate: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgencyReportDto)
  data: AgencyReportDto[]
}
