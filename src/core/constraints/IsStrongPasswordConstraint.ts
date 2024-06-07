import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    if (typeof password !== 'string') return false
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isValidLength = password.length >= 6 && password.length <= 24

    return hasUpperCase && hasNumber && hasSpecialCharacter && isValidLength
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be 6-24 characters long and include at least one uppercase letter, one number, and one special character'
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint
    })
  }
}
