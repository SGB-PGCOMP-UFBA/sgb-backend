import * as dotenv from 'dotenv'
dotenv.config()
export const jwtConstants = {
  secretKey: process.env.SECRET_KEY,
  expirationTime: process.env.EXPIRES_IN
}
export const errorMessages = {
  userNotFoundMessage: 'User not found',
  invalidPasswordMessage: 'Invalid password'
}
