import {
  IsString,
  MaxLength,
  IsIn,
  IsNumber,
  IsPositive
} from 'class-validator'

export class CreateEmbedNotificationDto {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  readonly owner_id: number

  @IsString()
  @IsIn(['ADMIN', 'ADVISOR', 'STUDENT'])
  readonly owner_type: string

  @IsString()
  @MaxLength(80)
  readonly title: string

  @IsString()
  @MaxLength(255)
  readonly description: string
}
