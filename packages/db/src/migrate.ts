/**
 * Aplica as migrações pendentes. Rodado por `make migrate` e como passo separado do
 * deploy, antes de apontar o tráfego para a revisão nova.
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createDatabase, createPool } from './client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL não definida.')
  process.exit(1)
}

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'migrations',
)

const pool = createPool(connectionString)
try {
  await migrate(createDatabase(pool), { migrationsFolder })
  console.warn('Migrações aplicadas.')
} finally {
  await pool.end()
}
