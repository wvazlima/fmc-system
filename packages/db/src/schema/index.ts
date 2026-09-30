/**
 * Schema Drizzle do FMC.
 *
 * Ainda vazio: as tabelas nascem com as features (ver `specs/features/`), a partir de
 * uma spec aprovada e de um `plan.md`. Não crie tabela aqui sem passar pelo fluxo SDD.
 *
 * Toda tabela de negócio carrega, obrigatoriamente (`.claude/rules/db.md`):
 *
 *   id               uuid PK, SEM default — UUID v7 vem do cliente (ADR-0009)
 *   organization_id  uuid not null        — constitution §3
 *   farm_id          uuid not null        — constitution §3
 *   version          integer not null     — controle de conflito no sync
 *   source           text not null        — 'app' | 'import' (constitution §11)
 *   created_at       timestamptz not null
 *   updated_at       timestamptz not null
 *   deleted_at       timestamptz null     — soft delete, propagado pelo sync
 *
 * Lançamento financeiro carrega também `accrual_date` E `cash_date` (ADR-0008).
 * Dinheiro é `numeric(14,2)` — nunca `float`.
 */

export {}
