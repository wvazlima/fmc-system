import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema/index.js'

export type Database = ReturnType<typeof createDatabase>

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 10 })
}

/**
 * Cria a conexão. A connection string vem de quem chama — este módulo não lê
 * `process.env` (ADR-0010: só `@fmc/config` conhece o ambiente).
 */
export function createDatabase(pool: pg.Pool) {
  return drizzle(pool, { schema })
}

/** Ping usado pelo `/health` da API e pelo healthcheck do Compose. */
export async function ping(pool: pg.Pool): Promise<{ postgis: string | null }> {
  const result = await pool.query<{ postgis: string | null }>('select postgis_version() as postgis')
  return { postgis: result.rows[0]?.postgis ?? null }
}
