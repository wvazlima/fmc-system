# ADR-0002 · Monorepo com pnpm e Turborepo

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

Quatro aplicações e quatro pacotes compartilhados, com dependência forte entre eles:
uma mudança no schema Zod de um lançamento atinge o front, a API e o worker na mesma
hora. O time é pequeno e o ciclo de release é único — não há versões independentes.

## Decisão

Um **monorepo** gerenciado por **pnpm workspaces** com **Turborepo** como orquestrador
de tarefas e cache.

Escopo dos pacotes: **`@fmc/`** — `@fmc/shared`, `@fmc/db`, `@fmc/ui`, `@fmc/config`.

Dependências internas usam `workspace:*`. Não há publicação em registry.

## Alternativas consideradas

### Repositórios separados

- **A favor:** fronteiras rígidas, deploy independente.
- **Contra:** uma mudança de contrato vira quatro PRs coordenados e um pacote publicado
  entre eles.
- **Por que não:** custo de coordenação alto demais para um time pequeno com release único.

### Monorepo com npm ou yarn, sem Turborepo

- **A favor:** menos ferramenta.
- **Contra:** sem cache de tarefas, o CI roda tudo a cada commit; sem `node_modules` por
  link simbólico, o disco e a instalação crescem muito.
- **Por que não:** o pnpm resolve instalação e disco; o Turborepo resolve o tempo de CI.

### Nx

- **A favor:** mais recursos, geradores, grafo rico.
- **Contra:** mais opinativo e com curva maior.
- **Por que não:** o Turborepo cobre o que precisamos (cache, grafo de tarefas, `--filter`)
  com bem menos superfície.

## Consequências

**Positivas**

- Mudança de contrato atravessa todos os consumidores num único PR, com o typecheck
  apontando o que quebrou.
- `turbo run build --filter=...[origin/main]` roda só o que o diff afeta.
- Configuração de TS, ESLint e Prettier centralizada em `@fmc/config`.

**Negativas e custos aceitos**

- Checkout maior e um CI que precisa entender filtros.
- O `node_modules` do pnpm é por link simbólico: ferramentas que não lidam bem com
  isso (alguns bundlers, Docker) exigem configuração específica. Já previsto no
  ADR-0010.

**O que passa a ser proibido**

- Dependência interna por caminho relativo atravessando a fronteira de um pacote
  (`import '../../../packages/db/src/...'`).
- Versão de dependência externa divergente entre pacotes sem justificativa.

## Como verificar que a decisão está sendo respeitada

`pnpm-workspace.yaml` e `turbo.json` na raiz; ESLint com `import/no-relative-packages`;
CI executa as tarefas via `turbo`.
