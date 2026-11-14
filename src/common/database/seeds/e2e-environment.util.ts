/**
 * O ambiente de teste e2e só existe dentro do GitHub Actions (ou na máquina de
 * quem desenvolve): banco e SMTP sobem no próprio job e morrem com ele. Estas
 * travas impedem que o seed, que apaga as tabelas, ou o servidor em modo
 * `test` alcancem um banco ou servidor de e-mail de verdade.
 */
export const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1']

export const E2E_DATABASE_SUFFIX = '_e2e'

export interface E2eEnvironment {
  NODE_ENV: string
  DATABASE_URL: string
  EMAIL_HOST?: string
}

function isLocalHost(host: string): boolean {
  return LOCAL_HOSTS.includes(host.replace(/^\[|\]$/g, '').toLowerCase())
}

function parseDatabaseUrl(databaseUrl: string): URL {
  try {
    return new URL(databaseUrl)
  } catch {
    throw new Error('DATABASE_URL inválida para o ambiente e2e.')
  }
}

/** Banco local, com nome terminado em `_e2e`, e `NODE_ENV=test`. */
export function assertE2eDatabase(environment: E2eEnvironment): void {
  if (environment.NODE_ENV !== 'test') {
    throw new Error(
      `Recusado: o ambiente e2e exige NODE_ENV=test (recebido: ${environment.NODE_ENV}).`
    )
  }

  const url = parseDatabaseUrl(environment.DATABASE_URL)

  if (!isLocalHost(url.hostname)) {
    throw new Error(
      `Recusado: o banco do ambiente e2e precisa ser local (recebido: ${url.hostname}).`
    )
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!databaseName.endsWith(E2E_DATABASE_SUFFIX)) {
    throw new Error(
      `Recusado: o banco do ambiente e2e precisa terminar em "${E2E_DATABASE_SUFFIX}" (recebido: ${databaseName}).`
    )
  }
}

/** Além do banco, o SMTP também precisa ser local (o Mailpit do job). */
export function assertE2eServer(environment: E2eEnvironment): void {
  assertE2eDatabase(environment)

  if (!environment.EMAIL_HOST || !isLocalHost(environment.EMAIL_HOST)) {
    throw new Error(
      `Recusado: em NODE_ENV=test o SMTP precisa ser local (recebido: ${environment.EMAIL_HOST}).`
    )
  }
}
