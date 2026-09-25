import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import { isValid, parse } from 'date-fns'

const CALENDAR_DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/

@ValidatorConstraint({ async: false })
export class IsCalendarDayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    if (typeof value !== 'string' || !CALENDAR_DAY_FORMAT.test(value)) {
      return false
    }

    return isValid(parse(value, 'yyyy-MM-dd', new Date()))
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid date in the YYYY-MM-DD format`
  }
}

export function IsCalendarDay(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCalendarDayConstraint
    })
  }
}
