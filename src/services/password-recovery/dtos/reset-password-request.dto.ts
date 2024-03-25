import { IsEmail, IsString } from 'class-validator'

export class ResetPasswordRequestDto
  implements Readonly<ResetPasswordRequestDto>
{
  public constructor(init?: Partial<ResetPasswordRequestDto>) {
    Object.assign(this, init)
  }

  @IsEmail()
  email: string

  @IsString()
  role: string
}
