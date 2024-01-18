const constants = {
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
        student: {
            CREATION_FAILED: 'Cant\'t create student.',
            STUDENT_NOT_FOUND: 'Student not found.'
        }
    }
}

export { constants }