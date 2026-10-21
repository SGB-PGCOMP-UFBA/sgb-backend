import { Type } from 'class-transformer'
import { IsInt, Min } from 'class-validator'

export class UserIdParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly id: number
}
