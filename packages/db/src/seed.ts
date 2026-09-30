/**
 * Popula dados de desenvolvimento.
 *
 * Dado FICTÍCIO sempre — nunca dado real de cliente, nem anonimizado a olho
 * (`.claude/rules/db.md`). O seed é idempotente: rodar duas vezes não duplica.
 *
 * Ainda sem conteúdo: os dados nascem junto com as tabelas, feature a feature.
 */
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL não definida.')
  process.exit(1)
}

console.warn('Seed: nenhuma tabela ainda. Os dados nascem com as features.')
