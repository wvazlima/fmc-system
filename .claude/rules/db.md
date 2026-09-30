---
paths:
  - 'packages/db/**'
---

# Regras — Banco de dados

PostgreSQL 16 + PostGIS, Drizzle ORM (ADR-0005).

## Toda tabela de negócio

Colunas obrigatórias, sem exceção:

| Coluna            | Tipo                   | Por quê                                                 |
| ----------------- | ---------------------- | ------------------------------------------------------- |
| `id`              | `uuid` PK              | UUID v7 **gerado no cliente** (ADR-0009). Sem `default` |
| `organization_id` | `uuid` not null        | constitution §3                                         |
| `farm_id`         | `uuid` not null        | constitution §3                                         |
| `version`         | `integer` not null     | controle de conflito no sync                            |
| `source`          | `text` not null        | `app` · `import` (constitution §11)                     |
| `created_at`      | `timestamptz` not null |                                                         |
| `updated_at`      | `timestamptz` not null | base do last-write-wins                                 |
| `deleted_at`      | `timestamptz` null     | soft delete, propagado pelo sync                        |

Exceções permitidas: `organizations` (é a raiz) e tabelas de catálogo global (lista de
UFs, moedas). Qualquer outra exceção exige ADR.

**Lançamento financeiro** carrega obrigatoriamente `accrual_date` **e** `cash_date`
(ADR-0008). Tabela de lançamento com uma data só não passa em revisão.

## Tipos

- **Dinheiro:** `numeric(14,2)`. **Nunca** `float`, `double precision` ou `real`.
- **Peso e área:** `numeric` com escala declarada. Área de talhão é **derivada da
  geometria**, não digitada.
- **Data de negócio** (competência, caixa, colheita): `date`.
  **Instante** (criação, sync): `timestamptz`.
- **Enum de domínio:** `text` + `CHECK`, não `enum` do Postgres — alterar `enum` em
  produção é dolorido.
- **Identificador externo** (GTA, brinco, nota): `text`, nunca numérico.

## Índices

- Todo acesso é escopado: o índice começa por `(organization_id, farm_id, ...)`.
- FK tem índice. O Postgres não cria sozinho.
- Coluna de geometria tem índice **GiST**, sempre.
- Coluna usada em filtro de data de relatório entra no índice composto.
- Índice parcial para soft delete quando a tabela for grande:
  `WHERE deleted_at IS NULL`.

## PostGIS

- Armazenamento em **SRID 4326**. Declare o SRID na coluna:
  `geometry(Polygon, 4326)`. Coluna sem SRID não passa.
- Cálculo de área: `ST_Area(geography)` ou reprojeção para **EPSG 31983**
  (SIRGAS 2000 / UTM 23S) quando a precisão exigir. Nunca `ST_Area` em 4326 direto — o
  resultado sai em graus quadrados.
- Área em hectares = metros quadrados ÷ 10.000, calculada pelo banco.
- Valide geometria na entrada (`ST_IsValid`); polígono inválido é rejeitado com erro de
  domínio, não corrigido em silêncio.

## Migrações

- **Migração aplicada é imutável.** Correção vem em migração nova. Um hook em
  `.claude/settings.json` bloqueia a edição.
- Geradas por `pnpm db:generate` a partir do schema Drizzle. Não escreva SQL de migração
  na mão sem necessidade — e quando escrever, explique no cabeçalho por quê.
- Toda migração é **aplicada e revertida** no ambiente local antes de sair do PR.
- Migração destrutiva (drop de coluna, mudança de tipo com perda) exige nota no PR e
  confirmação humana.
- Migração de dado pesado não roda no caminho de deploy: vira job no `worker`.

## Consultas

- Toda consulta filtra por `organization_id`. Sem exceção.
- Consulta de custo, margem e rateio é **SQL determinístico e testado** com número
  conferido à mão (constitution §4).
- `SELECT` lista as colunas. `select *` só em script de manutenção.
- Agregação pesada de relatório vive em **view** ou em função, versionada como migração —
  não montada por concatenação de string.

## Seed

- `pnpm db:seed` popula dados de desenvolvimento **fictícios**. Nunca dado real de
  cliente, nem anonimizado a olho.
- O seed é idempotente: rodar duas vezes não duplica.
