const constants = {
    expressions: {
        REGEX_TAX_ID: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    },
    messages: {
        TX_ID_FORMAT_ERROR: 'Insira um CPF válido! Formato: 000.000.000-00',
        EMAIL_FORMAT_ERROR: 'Insira um E-mail válido! Formato: alguem@exemplo.com.br'
    }
}

export { constants }