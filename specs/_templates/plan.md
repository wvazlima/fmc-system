# NNN · Plano de implementação — <Nome da feature>

> Gerado a partir de `spec.md` aprovada. Se a spec mudar, este plano é refeito.

## Resumo da abordagem

<3 a 5 linhas. Qual o caminho escolhido e por quê.>

## Modelo de dados

### Tabelas novas

#### `<table_name>`

| Coluna            | Tipo          | Nulo | Observação                                          |
| ----------------- | ------------- | ---- | --------------------------------------------------- |
| `id`              | `uuid`        | não  | PK, **UUID v7 gerado no cliente** (constitution §2) |
| `organization_id` | `uuid`        | não  | FK `organizations` (constitution §3)                |
| `farm_id`         | `uuid`        | não  | FK `farms` (constitution §3)                        |
| `version`         | `integer`     | não  | controle de conflito no sync                        |
| `source`          | `text`        | não  | `app` · `import` (constitution §11)                 |
| `created_at`      | `timestamptz` | não  |                                                     |
| `updated_at`      | `timestamptz` | não  |                                                     |
| `deleted_at`      | `timestamptz` | sim  | soft delete; o sync precisa propagar exclusão       |

<Para lançamento financeiro, incluir obrigatoriamente `accrual_date` e `cash_date`
(constitution §5).>

**Índices**

| Índice | Colunas                           | Motivo                 |
| ------ | --------------------------------- | ---------------------- |
|        | `(organization_id, farm_id, ...)` | todo acesso é escopado |

**Geometria (se houver)**: tipo, SRID (`4326` para armazenar, `31983` ou UTM local para
cálculo de área), índice GiST.

### Tabelas alteradas

| Tabela | Mudança | Migração é destrutiva? |
| ------ | ------- | ---------------------- |

## Endpoints

| Método | Rota                 | Perfis             | Entrada (Zod) | Saída | Idempotente |
| ------ | -------------------- | ------------------ | ------------- | ----- | ----------- |
| `POST` | `/farms/:farmId/...` | `owner`, `manager` | `XSchema`     | `Y`   | sim         |

Para cada endpoint: o que acontece quando o perfil é `operator`.

## Impacto no sync

- Entidades novas no protocolo: <...>
- Direção: push · pull · ambos
- Projeção por perfil: quais campos são removidos do payload de `operator`
- Tipo de conflito: evento (append-only) · cadastro (last-write-wins)
- Migração do schema local do Dexie: versão N → N+1, com o passo de upgrade
- Tamanho estimado do payload no primeiro sync de um dispositivo novo

## Telas

| Tela | Rota | Perfis | Estados                                        |
| ---- | ---- | ------ | ---------------------------------------------- |
|      |      |        | carregando · vazio · pendente · erro · offline |

Para cada tela: como ela se comporta offline e o que o operador vê.

## Regras de permissão

| Ação | `owner` | `manager` | `operator` |
| ---- | ------- | --------- | ---------- |
|      |         |           |            |

## Cálculos

<Toda fórmula desta feature, escrita por extenso. Onde é calculada (SQL ou TypeScript).
Nunca pela IA (constitution §4).>

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| ----- | ------------- | ------- | --------- |

## Testes

| Critério de aceite | Tipo de teste               | Onde |
| ------------------ | --------------------------- | ---- |
| CA-01              | unitário · integração · e2e |      |
| CA-OFF             | integração de sync          |      |
| CA-OP              | integração de autorização   |      |
