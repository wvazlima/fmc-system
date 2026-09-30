# ADR-0005 · PostgreSQL + PostGIS com Drizzle ORM

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O sistema precisa de: geometria de talhão com cálculo de área em hectares; agregações
financeiras por fazenda, safra, talhão e lote; transação forte entre venda e
lançamento; e tipos numéricos exatos para dinheiro.

## Decisão

**PostgreSQL 16 com a extensão PostGIS**, em Cloud SQL na nuvem e em container
`postgis/postgis:16-3.4` no local.

**Drizzle ORM** para schema e consultas, com **Drizzle Kit** para migrações. **Zod**
para validação, com os schemas compartilhados em `@fmc/shared`.

Convenções firmadas:

- Geometria armazenada em **SRID 4326**; cálculo de área com `ST_Area(geography)` ou
  reprojeção para UTM (SIRGAS 2000 / UTM 23S, EPSG 31983) quando a precisão exigir.
- Índice **GiST** em toda coluna de geometria.
- Dinheiro em `numeric(14,2)`. **Nunca** `float` ou `double precision`.
- Migração aplicada é **imutável**: correção vem em migração nova.

## Alternativas consideradas

### Prisma

- **A favor:** ecossistema maior, DX conhecida.
- **Contra:** suporte a PostGIS depende de `Unsupported` e SQL cru, perdendo o tipo; a
  camada de query é mais distante do SQL, o que atrapalha as agregações de custo.
- **Por que não:** os dois pontos que mais importam aqui (geometria e SQL analítico) são
  os dois pontos fracos.

### SQL puro com `pg`

- **A favor:** controle total.
- **Contra:** sem tipos derivados do schema e sem ferramenta de migração.
- **Por que não:** o Drizzle dá os tipos e as migrações e ainda permite SQL cru onde
  precisa.

### PostGIS fora do banco (GeoJSON em coluna JSON, cálculo na aplicação)

- **A favor:** um componente a menos.
- **Contra:** cálculo de área correto exige projeção; consulta espacial em JSON não usa
  índice.
- **Por que não:** reimplementar PostGIS mal.

## Consequências

**Positivas**

- Área de talhão calculada pelo banco, a partir do polígono — nunca digitada.
- Agregações de custo em SQL, determinísticas e testáveis (constitution §4).
- Tipos TypeScript derivados do schema; contrato único com `@fmc/shared`.

**Negativas e custos aceitos**

- Cloud SQL com PostGIS é mais caro que um Postgres gerenciado simples.
- Drizzle é mais novo que Prisma; breaking change entre versões é possível. Versão fixa
  e atualizada de forma deliberada.

**O que passa a ser proibido**

- `float` para dinheiro.
- Editar migração já aplicada (bloqueado por hook).
- Coluna de geometria sem SRID declarado e sem índice GiST.
- Tabela de negócio sem `organization_id` e `farm_id`.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/db.md`; hook em `.claude/settings.json` bloqueando edição de migração
aplicada; agente `dados-postgis`; skill `postgis-mapas`.
