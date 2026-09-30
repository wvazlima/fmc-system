/**
 * Leitura de configuração de ambiente.
 *
 * Este é o ÚNICO lugar do sistema que olha para `process.env` e para o nome do
 * ambiente. Código de domínio recebe a dependência já resolvida — nada de
 * `if (process.env.NODE_ENV === 'development')` espalhado (ADR-0010).
 */
/**
 * Na Fase 1 só `local` e `prod` existem de fato: o ambiente local em Docker é o de
 * desenvolvimento (ADR-0014). `dev` e `staging` permanecem no tipo de propósito — o
 * caminho precisa continuar aberto para quando um segundo ambiente entrar, e mantê-los
 * aqui torna essa adição uma mudança de configuração, não de código.
 */
export type AppEnv = 'local' | 'dev' | 'staging' | 'prod'

const APP_ENVS: readonly AppEnv[] = ['local', 'dev', 'staging', 'prod']

export class MissingEnvError extends Error {
  constructor(readonly key: string) {
    super(`Variável de ambiente obrigatória não definida: ${key}`)
    this.name = 'MissingEnvError'
  }
}

/** Lê uma variável obrigatória. Lança na inicialização, não no meio de uma requisição. */
export function requireEnv(key: string, source: NodeJS.ProcessEnv = process.env): string {
  const value = source[key]
  if (value === undefined || value === '') throw new MissingEnvError(key)
  return value
}

/** Lê uma variável opcional, com valor padrão. */
export function optionalEnv(
  key: string,
  fallback: string,
  source: NodeJS.ProcessEnv = process.env,
): string {
  const value = source[key]
  return value === undefined || value === '' ? fallback : value
}

export function readAppEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const value = optionalEnv('APP_ENV', 'local', source)
  if (!APP_ENVS.includes(value as AppEnv)) {
    throw new Error(`APP_ENV inválido: ${value}. Use um de: ${APP_ENVS.join(', ')}.`)
  }
  return value as AppEnv
}
