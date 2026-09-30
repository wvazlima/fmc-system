import { defineConfig } from 'drizzle-kit'

/**
 * Migração aplicada é imutável (ADR-0005). Correção vem em migração nova.
 * Um hook em `.claude/settings.json` bloqueia a edição de migração já versionada.
 */
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://fmc:changeme@localhost:5432/fmc',
  },
  verbose: true,
  strict: true,
})
