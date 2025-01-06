import * as dotenv from 'dotenv'
dotenv.config()

const constants = {
  api: {
    API_KEY: process.env.API_KEY
  },
  errors: {
    TOKEN_EXPIRED_ERROR: 'TokenExpiredError'
  },
  jwt: {
    SECRET_KEY: process.env.APP_SECRET_KEY,
    EXPIRATION_TIME: process.env.APP_SECRET_KEY_EXPIRES_IN
  },
  expressions: {
    REGEX_TAX_ID: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    REGEX_EMAIL:
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  },
  bodyValidationMessages: {
    NAME_FORMAT_ERROR: 'Insira um nome válido.',
    PHONE_FORMAT_ERROR: 'Insira um número de telefone válido.',
    LATTES_LINK_FORMAT_ERROR:
      'O link digitado para o currículo lattes possui um formato inválido.',
    TAX_ID_FORMAT_ERROR: 'O CPF digitado possui um formato inválido.',
    EMAIL_FORMAT_ERROR: 'O e-mail digitado possui um formato inválido.',
    ENROLLMENT_NUMBER_FORMAT_ERROR:
      'Insira um número de matrícula válido com 9 ou 10 dígitos.',
    PASSWORD_IS_WEAK:
      'A senha deve conter pelo menos 6 caracteres, incluindo 1 número, 1 letra maiúscula e 1 caracter especial.',
    PASSWORD_IS_NOT_ACCEPTABLE: 'A senha deve ter entre 4 e 8 caracteres.',
    PASSWORD_NOT_MATCHING: 'A senha e o confirmar senha são diferentes.',
    CURRENT_PASSWORD_NOT_MATCHING: 'Sua senha atual está incorreta.'
  },
  negotialValidationMessages: {
    ENROLLMENT_NUMBER_ALREADY_REGISTERED:
      'Parece que esta matrícula já está cadastrada.',
    EMAIL_ALREADY_REGISTERED: 'Parece que este e-mail já está sendo utilizado.',
    TAX_ID_ALREADY_REGISTERED: 'Parece que este CPF já está sendo utilizado.',
    PHONE_NUMBER_ALREADY_REGISTERED:
      'Parece que este número de telefone já está sendo utilizado.',
    LINK_TO_LATTES_ALREADY_REGISTERED:
      'Parece que este link para o currículo lattes já está sendo utilizado.'
  },
  exceptionMessages: {
    admin: {
      CREATION_FAILED: "Cant't create admin.",
      UPDATE_FAILED: "Cant't update admin.",
      NOT_FOUND: 'Admin not found.',
      WRONG_PASSWORD: 'Invalid password.'
    },
    advisor: {
      CREATION_STARTED:
        'The process of inserting a new advisor has been started.',
      CREATION_COMPLETED:
        'The process of inserting a new advisor has been completed.',
      CREATION_FAILED: "Cant't create advisor.",
      UPDATE_FAILED: "Cant't update advisor.",
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
    notification: {
      CREATION_COMPLETED:
        'The process of inserting a new notification has been completed.',
      CREATION_FAILED: "Cant't create notification.",
      UPDATE_FAILED: "Cant't update notification.",
      DELETE_ALL_STARTED:
        'The process of deleting all notifications has been started.'
    },
    student: {
      ALREADY_REGISTERED: 'This student is already registered.',
      CREATION_STARTED:
        'The process of inserting a new student has been started.',
      CREATION_COMPLETED:
        'The process of inserting a new student has been completed.',
      CREATION_FAILED: "Cant't create student.",
      UPDATE_FAILED: "Cant't update student.",
      NOT_FOUND: 'Student not found.',
      COUNT_BY_SCHOLARSHIP_FAILED: 'Failed to count students by scholarship.',
      DELETE_ALL_STARTED:
        'The process of deleting all students has been started.'
    },
    enrollment: {
      CREATION_STARTED:
        'The process of inserting a new enrollment has been started.',
      CREATION_COMPLETED:
        'The process of inserting a new enrollment has been completed.',
      CREATION_FAILED: "Cant't create enrollment.",
      UPDATE_FAILED: "Cant't update enrollment.",
      DEACTIVATE_FAILED: "Can't deactivate this enrollment.",
      NOT_FOUND: 'Enrollment not found.',
      DELETE_ALL_STARTED:
        'The process of deleting all enrollments has been started.'
    },
    scholarship: {
      CREATION_STARTED:
        'The process of inserting a new scholarship has been started.',
      CREATION_COMPLETED:
        'The process of inserting a new scholarship has been completed.',
      CREATION_FAILED: "Cant't create scholarship.",
      UPDATE_FAILED: "Cant't update scholarship.",
      FINISH_FAILED: "Can't finish this scholarship.",
      NOT_FOUND: 'Scholarship not found.',
      COUNT_FAILED: 'Failed to count scholarships.',
      DELETE_ALL_STARTED:
        'The process of deleting all scholarships has been started.',
      ALREADY_REGISTERED:
        'Já existe uma bolsa cadastrada com os mesmos detalhes informados.'
    },
    user: {
      SOMETHING_WRONG: 'Something went wrong.',
      NOT_FOUND: 'User not found.',
      WRONG_PASSWORD: 'Invalid password.'
    },
    token: {
      EXPIRED_ERROR: 'This token has expired, please try again!'
    },
    dataManager: {
      IMPORT_FAILED: "Can't import scholarships from CSV file.",
      EXPORT_FAILED: "Can't export scholarships to CSV file.",
      INVALID_FILE: 'Only CSV files are allowed.',
      PROCESS_FAILED: 'Error processing the CSV file.',
      PROCESS_COMPLETED: 'CSV file processed successfully.',
      DELETE_FAILED: 'Failed to delete data.'
    }
  }
}

export { constants }
