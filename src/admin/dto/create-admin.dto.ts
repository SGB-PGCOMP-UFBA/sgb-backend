import { IsEmail, IsString, Length } from 'class-validator'

export class CreateAdminDto {
  @IsString() readonly name: string
  @IsString() @Length(14, 14) readonly tax_id: string
  @IsEmail() readonly email: string
  @IsString() readonly password: string
  @IsString() readonly role: string
}
