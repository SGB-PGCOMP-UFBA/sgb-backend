import * as dotenv from 'dotenv'
dotenv.config()

const constants = {
  errors: {
    TOKEN_EXPIRED_ERROR: 'TokenExpiredError'
  },
  jwt: {
    secretKey: process.env.SECRET_KEY,
    expirationTime: process.env.EXPIRES_IN
  },
  expressions: {
    REGEX_TAX_ID: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    REGEX_EMAIL:
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  },
  bodyValidationMessages: {
    NAME_FORMAT_ERROR: 'Insira um nome válido.',
    PHONE_FORMAT_ERROR: 'Insira um número de telefone válido!',
    LATTES_LINK_FORMAT_ERROR:
      'Insira um link lattes válido no formato: http://lattes.cnpq.br/999999999999',
    TAX_ID_FORMAT_ERROR: 'Insira um CPF válido!',
    EMAIL_FORMAT_ERROR:
      'Insira um E-mail válido! Formato: alguem@exemplo.com.br',
    ENROLLMENT_NUMBER_FORMAT_ERROR:
      'Insira um número de matrícula válido com 9 dígitos.'
  },
  negotialValidationMessages: {
    EMAIL_ALREADY_REGISTERED: 'Parece que este e-mail já está sendo utilizado.',
    TAX_ID_ALREADY_REGISTERED:
      'Parece que já existe um usuário cadastrado com este CPF.'
  },
  exceptionMessages: {
    admin: {
      CREATION_FAILED: "Cant't create admin.",
      NOT_FOUND: 'Admin not found.'
    },
    advisor: {
      CREATION_FAILED: "Cant't create advisor.",
      NOT_FOUND: 'Advisor not found.'
    },
    article: {
      CREATION_FAILED: "Cant't create article.",
      NOT_FOUND: 'Article not found.'
    },
    agency: {
      CREATION_FAILED: "Cant't create agency.",
      NOT_FOUND: 'Agency not found.'
    },
    student: {
      CREATION_STARTED: 'The process of inserting a new student has started.',
      CREATION_COMPLETED:
        'The process of inserting a new student has been completed.',
      CREATION_FAILED: "Cant't create student.",
      NOT_FOUND: 'Student not found.',
      COUNT_BY_SCHOLARSHIP_FAILED: 'Failed to count students by scholarship.'
    },
    enrollment: {
      CREATION_FAILED: "Cant't create enrollment.",
      DEACTIVATE_FAILED: "Can't deactivate this enrollment.",
      NOT_FOUND: 'Enrollment not found.'
    },
    scholarship: {
      CREATION_FAILED: "Cant't create scholarship.",
      DEACTIVATE_FAILED: "Can't deactivate this scholarship.",
      NOT_FOUND: 'Scholarship not found.',
      COUNT_FAILED: 'Failed to count scholarships.'
    },
    user: {
      SOMETHING_WRONG: 'Something went wrong.',
      NOT_FOUND: 'User not found.',
      WRONG_PASSWORD: 'Invalid password.'
    },
    token: {
      EXPIRED_ERROR: 'This token has expired, please try again!'
    }
  }
}

export { constants }
