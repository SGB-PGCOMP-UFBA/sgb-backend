import { IsOptional } from 'class-validator'

export class UpdateAdminDto {
  @IsOptional() readonly name: string
  @IsOptional() readonly tax_id: string
  @IsOptional() readonly email: string
  @IsOptional() readonly password: string
}
