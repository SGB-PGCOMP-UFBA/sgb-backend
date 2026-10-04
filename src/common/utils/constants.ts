import { env } from '@/config/env.validation'

const constants = {
  api: {
    API_KEY: env.API_KEY
  },
  errors: {
    TOKEN_EXPIRED_ERROR: 'TokenExpiredError'
  },
  jwt: {
    SECRET_KEY: env.APP_SECRET_KEY,
    EXPIRATION_TIME: env.APP_SECRET_KEY_EXPIRES_IN
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
      CREATION_FAILED: 'Não foi possível cadastrar o administrador.',
      UPDATE_FAILED: 'Não foi possível atualizar o administrador.',
      NOT_FOUND: 'Administrador não encontrado.',
      WRONG_PASSWORD: 'Senha inválida.'
    },
    advisor: {
      CREATION_STARTED:
        'O processo de cadastro de um novo orientador foi iniciado.',
      CREATION_COMPLETED:
        'O processo de cadastro de um novo orientador foi concluído.',
      CREATION_FAILED: 'Não foi possível cadastrar o orientador.',
      UPDATE_FAILED: 'Não foi possível atualizar o orientador.',
      NOT_FOUND: 'Orientador não encontrado.'
    },
    article: {
      CREATION_FAILED: 'Não foi possível cadastrar o artigo.',
      NOT_FOUND: 'Artigo não encontrado.'
    },
    agency: {
      CREATION_FAILED: 'Não foi possível cadastrar a agência.',
      NOT_FOUND: 'Agência não encontrada.',
      NAME_IS_REQUIRED: 'A agência de fomento é obrigatória.',
      AWARDED_BELOW_ALLOCATED:
        'A quantidade de bolsas concedidas pela agência não pode ser menor que a quantidade já alocada.'
    },
    allocation: {
      CREATION_FAILED: 'Não foi possível cadastrar a alocação.',
      NOT_FOUND: 'Alocação não encontrada.',
      NAME_IS_REQUIRED: 'A alocação é obrigatória.'
    },
    notification: {
      CREATION_COMPLETED:
        'O processo de cadastro de uma nova notificação foi concluído.',
      CREATION_FAILED: 'Não foi possível cadastrar a notificação.',
      UPDATE_FAILED: 'Não foi possível atualizar a notificação.'
    },
    student: {
      CREATION_STARTED:
        'O processo de cadastro de um novo estudante foi iniciado.',
      CREATION_COMPLETED:
        'O processo de cadastro de um novo estudante foi concluído.',
      CREATION_FAILED: 'Não foi possível cadastrar o estudante.',
      UPDATE_FAILED: 'Não foi possível atualizar o estudante.',
      NOT_FOUND: 'Estudante não encontrado.',
      COUNT_BY_SCHOLARSHIP_FAILED: 'Falha ao contar os estudantes por bolsa.'
    },
    enrollment: {
      CREATION_STARTED:
        'O processo de cadastro de uma nova matrícula foi iniciado.',
      CREATION_COMPLETED:
        'O processo de cadastro de uma nova matrícula foi concluído.',
      CREATION_FAILED: 'Não foi possível cadastrar a matrícula.',
      UPDATE_FAILED: 'Não foi possível atualizar a matrícula.',
      DEACTIVATE_FAILED: 'Não foi possível desativar esta matrícula.',
      NOT_FOUND: 'Matrícula não encontrada.'
    },
    scholarship: {
      CREATION_STARTED:
        'O processo de cadastro de uma nova bolsa foi iniciado.',
      CREATION_COMPLETED:
        'O processo de cadastro de uma nova bolsa foi concluído.',
      CREATION_FAILED: 'Não foi possível cadastrar a bolsa.',
      UPDATE_FAILED: 'Não foi possível atualizar a bolsa.',
      FINISH_FAILED: 'Não foi possível finalizar esta bolsa.',
      EXTEND_FAILED: 'Não foi possível prorrogar esta bolsa.',
      NOT_FOUND: 'Bolsa não encontrada.',
      COUNT_FAILED: 'Falha ao contar as bolsas.',
      ALREADY_REGISTERED:
        'Já existe uma bolsa cadastrada com os mesmos detalhes informados.',
      NO_SLOTS_AVAILABLE: 'Não há vagas disponíveis para esta bolsa.',
      ENROLLMENT_ALREADY_HAS_ACTIVE:
        'Esta matrícula já possui uma bolsa vigente. Finalize a bolsa atual antes de cadastrar outra.',
      QUOTA_NOT_CONFIGURED:
        'Não há vagas concedidas cadastradas para esta bolsa.'
    },
    user: {
      SOMETHING_WRONG: 'Algo deu errado.',
      NOT_FOUND: 'Usuário não encontrado.',
      WRONG_PASSWORD: 'Senha inválida.'
    },
    token: {
      EXPIRED_ERROR: 'Este token expirou, tente novamente!'
    },
    dates: {
      END_DATE_SMALLER:
        'A data de término não pode ser anterior à data de início.',
      END_DATE_EXCEEDED:
        'A data de término não pode ultrapassar o limite estimado.',
      EXTENSION_DATE_SMALLER:
        'A data de prorrogação não pode ser anterior à data de término.',
      EXTENSION_DATE_EXCEEDED:
        'A data de prorrogação não pode ultrapassar o limite de 6 meses.'
    }
  }
}

export { constants }
