import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'

@ValidatorConstraint({ async: false })
export class IsPasswordAcceptableConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    if (typeof password !== 'string') return false

    const trimmedPassword = password.trim()

    const isValidLength =
      trimmedPassword.length >= 4 && trimmedPassword.length <= 8

    return isValidLength
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be 4-8 characters long'
  }
}

export function IsAcceptablePassword(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPasswordAcceptableConstraint
    })
  }
}
