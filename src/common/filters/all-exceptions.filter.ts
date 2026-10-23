import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { Request, Response } from 'express'
import { EntityNotFoundError, QueryFailedError } from 'typeorm'
import { constants } from '@/common/utils/constants'

export interface ErrorResponse {
  statusCode: number
  message: string
}

const messages = constants.exceptionMessages.http

const POSTGRES_ERRORS: Record<string, ErrorResponse> = {
  '23505': { statusCode: HttpStatus.CONFLICT, message: messages.DUPLICATED },
  '23503': {
    statusCode: HttpStatus.CONFLICT,
    message: messages.REFERENCED
  },
  '22001': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: messages.INVALID_DATA
  },
  '22007': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: messages.INVALID_DATA
  },
  '22008': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: messages.INVALID_DATA
  },
  '22P02': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: messages.INVALID_DATA
  },
  '23502': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: messages.INVALID_DATA
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpError')

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const body = toErrorResponse(exception)

    this.log(exception, body, `${request.method} ${request.originalUrl}`)

    response.status(body.statusCode).json(body)
  }

  private log(exception: unknown, body: ErrorResponse, route: string) {
    const summary = `${route} -> ${body.statusCode}`

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${summary}: ${describe(exception)}`,
        exception instanceof Error ? exception.stack : undefined
      )
      return
    }

    if (exception instanceof QueryFailedError) {
      this.logger.warn(`${summary}: ${describe(exception)}`)
    }
  }
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof HttpException) {
    return {
      statusCode: exception.getStatus(),
      message: httpExceptionMessage(exception)
    }
  }

  if (exception instanceof EntityNotFoundError) {
    return { statusCode: HttpStatus.NOT_FOUND, message: messages.NOT_FOUND }
  }

  if (exception instanceof QueryFailedError) {
    const known = POSTGRES_ERRORS[postgresCode(exception)]
    if (known) return known
  }

  const clientError = expressClientErrorStatus(exception)
  if (clientError) {
    return { statusCode: clientError, message: messages.BAD_REQUEST }
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: messages.INTERNAL_ERROR
  }
}

function httpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse()
  const message =
    typeof response === 'object' && response !== null && 'message' in response
      ? (response as { message: unknown }).message
      : exception.message

  if (Array.isArray(message)) return String(message[0] ?? exception.message)

  return typeof message === 'string' ? message : exception.message
}

function expressClientErrorStatus(exception: unknown): number | null {
  if (typeof exception !== 'object' || exception === null) return null

  const { status, expose } = exception as { status?: unknown; expose?: unknown }

  return typeof status === 'number' && status >= 400 && status < 500 && expose
    ? status
    : null
}

function postgresCode(error: QueryFailedError): string {
  return String((error.driverError as { code?: unknown })?.code ?? '')
}

function describe(exception: unknown): string {
  if (exception instanceof QueryFailedError) {
    const driverError = exception.driverError as {
      code?: string
      constraint?: string
      detail?: string
    }

    return [
      `postgres ${driverError.code ?? '?'}`,
      driverError.constraint && `constraint ${driverError.constraint}`,
      driverError.detail ?? exception.message
    ]
      .filter(Boolean)
      .join(' | ')
  }

  return exception instanceof Error ? exception.message : String(exception)
}
