# AGENTS.md

Este repositório usa **`CLAUDE.md`** como documento principal de instruções.

👉 **Leia [`CLAUDE.md`](./CLAUDE.md) primeiro.** Ele tem o resumo do produto, o stack, o
mapa do monorepo, os comandos, os 11 princípios invioláveis, o fluxo de trabalho e as
convenções.

Este arquivo existe apenas para compatibilidade com ferramentas que procuram por
`AGENTS.md`.

## Antes de escrever qualquer código

| Leia                                               | Para                                      |
| -------------------------------------------------- | ----------------------------------------- |
| [`CLAUDE.md`](./CLAUDE.md)                         | regras do dia a dia, comandos, convenções |
| [`specs/constitution.md`](./specs/constitution.md) | os 11 princípios que não se quebram       |
| [`specs/glossario.md`](./specs/glossario.md)       | como nomear qualquer coisa do domínio     |
| [`specs/arquitetura.md`](./specs/arquitetura.md)   | como os serviços se encaixam              |
| [`specs/adr/`](./specs/adr/)                       | por que cada decisão foi tomada           |

## O mínimo que você precisa saber

- **Spec-Driven Development.** Feature nova começa em `specs/features/NNN-slug/spec.md`,
  aprovada por um humano, antes de qualquer código.
- **Offline-first.** A tela lê e escreve no banco local (Dexie); o sync roda por trás.
- **Operador nunca vê valor, custo, margem ou preço** — nem na API, nem no sync.
- **Todo dado de negócio tem `organization_id` e `farm_id`.**
- **Todo lançamento financeiro tem duas datas:** `accrual_date` e `cash_date`.
- **Números são calculados por código, nunca por IA.**
- Documentação em pt-BR; código, tabelas e rotas em inglês.
- Commits em Conventional Commits, em inglês, sem `Co-Authored-By`.
- `git push` e `--force` só com confirmação explícita.

## Como rodar

```bash
pnpm install
make up        # sobe a stack completa em Docker
make health    # confere se todos os serviços estão saudáveis
pnpm test
```

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
