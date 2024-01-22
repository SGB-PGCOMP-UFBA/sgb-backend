import * as dotenv from 'dotenv'
dotenv.config()

const constants = {
    jwt: {
        secretKey: process.env.SECRET_KEY,
        expirationTime: process.env.EXPIRES_IN
    },
    expressions: {
        REGEX_TAX_ID: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        REGEX_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    },
    bodyValidationMessages: {
        NAME_FORMAT_ERROR: 'Insira um nome válido.',
        PHONE_FORMAT_ERROR: 'Insira um número de telefone válido com 11 dígitos.',
        LATTES_LINK_FORMAT_ERROR: 'Insira um link lattes válido no formato: http://lattes.cnpq.br/999999999999',
        TAX_ID_FORMAT_ERROR: 'Insira um CPF válido! Formato: 000.000.000-00',
        EMAIL_FORMAT_ERROR: 'Insira um E-mail válido! Formato: alguem@exemplo.com.br',
        ENROLLMENT_NUMBER_FORMAT_ERROR: 'Insira um número de matrícula válido com 9 dígitos.'
    },
    negotialValidationMessages: {
        EMAIL_ALREADY_REGISTERED: 'Parece que este e-mail já está sendo utilizado.',
        TAX_ID_ALREADY_REGISTERED: 'Parece que já existe um usuário cadastrado com este CPF.'
    },
    exceptionMessages: {
        admin: {
            CREATION_FAILED: 'Cant\'t create admin.',
            NOT_FOUND: 'Admin not found.'
        },
        advisor: {
            CREATION_FAILED: 'Cant\'t create advisor.',
            NOT_FOUND: 'Advisor not found.'
        },
        article: {
            CREATION_FAILED: 'Cant\'t create article.',
            NOT_FOUND: 'Article not found.'
        },
        student: {
            CREATION_FAILED: 'Cant\'t create student.',
            NOT_FOUND: 'Student not found.'
        },
        scholarship: {
            CREATION_FAILED: 'Cant\'t create scholarship.',
            DEACTIVATE_FAILED: 'Can\'t deactivate this scholarship.',
            NOT_FOUND: 'Scholarship not found.'
        },
        user: {
            SOMETHING_WRONG: 'Something went wrong.',
            NOT_FOUND: 'User not found.',
            WRONG_PASSWORD: 'Invalid password.'
        }
    }
}

export { constants }