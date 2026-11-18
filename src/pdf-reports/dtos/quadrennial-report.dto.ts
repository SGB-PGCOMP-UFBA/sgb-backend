import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  ValidateNested,
  Min,
  IsObject,
  IsOptional
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

  /**
   * Obsoleto: o balde de ativas era uma cópia do total. Aceito e ignorado só
   * para o front anterior não receber 400 enquanto os deploys não se alinham.
   */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DegreeCountDto)
  activeCount?: DegreeCountDto

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
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  startDate?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  endDate?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgencyReportDto)
  data: AgencyReportDto[]
}
