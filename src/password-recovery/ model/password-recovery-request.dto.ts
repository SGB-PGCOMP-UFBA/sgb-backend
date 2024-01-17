import { IsEmail } from 'class-validator'

export class PasswordRecoveryRequestDto
  implements Readonly<PasswordRecoveryRequestDto>
{
  public constructor(init?: Partial<PasswordRecoveryRequestDto>) {
    Object.assign(this, init)
  }
  @IsEmail()
  email: string
}
