# Migrações

Geradas por `pnpm db:generate` a partir do schema Drizzle em `../src/schema/`.
Aplicadas por `make migrate` (ou `pnpm db:migrate`).

## Migração aplicada é imutável

Correção vem em **migração nova** (ADR-0005). Um hook em `.claude/settings.json` bloqueia
a edição de qualquer arquivo daqui que já esteja no `git HEAD`.

Antes de abrir o PR, toda migração nova precisa ter sido **aplicada e revertida** no
ambiente local.
