import { HttpException, HttpStatus } from '@nestjs/common'

export class CustomValidationException extends HttpException {
  constructor(errors: any[]) {
    const firstError = errors[0]
    const firstMessage = firstError
      ? Object.values(firstError.constraints || {})[0]
      : 'Validation failed'

    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: firstMessage
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    )
  }
}
