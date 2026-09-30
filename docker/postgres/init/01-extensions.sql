-- Extensões do banco local. A MESMA versão maior de Postgres e PostGIS roda em
-- Cloud SQL (ADR-0010) — o que muda é o gerenciamento, não o motor.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Usado para a coluna `id` de tabelas criadas pelo próprio servidor (log de auditoria,
-- lote de importação). Tabela de negócio recebe o UUID v7 do cliente (ADR-0009) e
-- NUNCA tem default de id.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Busca por similaridade: agrupar fornecedor grafado de vários jeitos na importação
-- das planilhas (skill `importacao-planilhas`).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Remove acento na comparação de texto (nome de talhão, fornecedor).
CREATE EXTENSION IF NOT EXISTS unaccent;
