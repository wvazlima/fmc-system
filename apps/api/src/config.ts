import { optionalEnv, readAppEnv, requireEnv } from '@fmc/config'

/**
 * Toda leitura de ambiente da API acontece aqui, na inicialização. O resto do código
 * recebe a configuração já resolvida (ADR-0010).
 */
export type ApiConfig = {
  appEnv: ReturnType<typeof readAppEnv>
  host: string
  port: number
  logLevel: string
  databaseUrl: string
  /** A API rejeita com 403 toda requisição sem este cabeçalho (ADR-0006). */
  edgeSecret: string
}

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    appEnv: readAppEnv(env),
    host: optionalEnv('API_HOST', '0.0.0.0', env),
    port: Number(optionalEnv('API_PORT', '3001', env)),
    logLevel: optionalEnv('LOG_LEVEL', 'info', env),
    databaseUrl: requireEnv('DATABASE_URL', env),
    edgeSecret: requireEnv('EDGE_SECRET', env),
  }
}
