import { generateRandomString } from './string-utils'

export function decidePassword(user) {
  if (user.password) {
    return user.password
  } else if (user.tax_id) {
    return user.tax_id.replace(/[-.]/g, '')
  } else if (user.email) {
    return user.email
  } else if (user.name) {
    return user.name
      .split(' ')
      .map((nome) => nome.charAt(0))
      .join('')
  }

  return generateRandomString(4)
}
