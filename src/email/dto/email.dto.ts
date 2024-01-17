import { IsString, IsNotEmpty } from 'class-validator'

export class EmailDto implements Readonly<EmailDto> {
  @IsString()
  @IsNotEmpty()
  to: string

  @IsString()
  from?: string

  @IsString()
  subject?: string

  @IsString()
  @IsNotEmpty()
  template: string

  context: object
}
