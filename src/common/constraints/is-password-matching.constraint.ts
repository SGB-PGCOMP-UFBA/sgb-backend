import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'

@ValidatorConstraint({ async: false })
export class IsPasswordMatchingConstraint
  implements ValidatorConstraintInterface
{
  validate(confirm: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints
    const relatedValue: string = (args.object as any)[relatedPropertyName]
    return confirm.trim() === relatedValue.trim()
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password and confirm password do not match'
  }
}

export function IsPasswordMatching(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsPasswordMatchingConstraint
    })
  }
}
