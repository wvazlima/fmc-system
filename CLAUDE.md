# FMC Gestão Agrícola — instruções do projeto

## O produto

Sistema de gestão rural **multipropriedade, mobile-first e offline-first** para um
produtor rural pessoa física com **5 fazendas** no Sul de Minas (arquitetura pronta para
1 a 10 e, no futuro, SaaS multi-cliente). Hoje tudo roda em Excel.
Quatro frentes: **gado** como mercadoria (compra, emprenha, vende), **café** por talhão
e safra, **lavouras eventuais** e **pessoal** — mais os **custos compartilhados**, com
rateio em dois níveis. Três perfis: **dono**, **gerente** e **operador**.
O nome do produto é provisório e vive só em `packages/config/src/brand.ts` (ADR-0011).

## Stack

TypeScript em tudo (ADR-0001). Monorepo pnpm + Turborepo (ADR-0002).
**web:** Next.js App Router exportado estático, PWA com Serwist, Dexie (IndexedDB),
TanStack Query, Tailwind + shadcn/ui, MapLibre GL.
**api:** Node + Fastify, monólito modular (ADR-0003).
**banco:** PostgreSQL 16 + PostGIS, Drizzle ORM, Zod (ADR-0005).
**auth:** Identity Platform; emulador Firebase no local (ADR-0012).
**infra:** Google Cloud (núcleo) + Cloudflare (borda, ADR-0006), Terraform + Terragrunt
(ADR-0013). Na Fase 1, um só ambiente de nuvem: `local` é o dev (ADR-0014).
**local:** stack completa em Docker Compose (ADR-0010).

## Mapa do monorepo

```
apps/web      PWA Next.js            apps/api      Fastify (módulos por domínio)
apps/worker   jobs batch/agendados   apps/edge     Cloudflare Worker (proxy reverso)
packages/shared  Zod, tipos, protocolo de sync     packages/db   schema Drizzle + migrations
packages/ui      componentes                       packages/config  tsconfig/eslint/prettier/brand
specs/        constitution, glossário, arquitetura, roadmap, ADRs, features
infra/terraform  módulos Terraform + raízes Terragrunt por ambiente
```

Módulos da API: `farms`, `cattle`, `coffee`, `crops`, `finance`, `sync`, `maps`,
`accounting`, `users`. Cada um com `routes.ts`, `service.ts`, `repository.ts`,
`schemas.ts`, `__tests__/`.

## Comandos

| Ação                            | Comando                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| Instalar                        | `pnpm install`                                              |
| Subir tudo (Docker)             | `make up` — derruba com `make down`, logs com `make logs`   |
| Saúde dos serviços              | `make health`                                               |
| Dev sem Docker                  | `pnpm dev`                                                  |
| Build / lint / typecheck / test | `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` |
| Um pacote só                    | `pnpm --filter @fmc/api <script>`                           |
| Migração: gerar / aplicar       | `pnpm db:generate` · `make migrate`                         |
| Seed local                      | `make seed`                                                 |

## Princípios invioláveis

Resumo. A versão completa, com o porquê e os exemplos do que é proibido, está em
`specs/constitution.md`. **Violar um destes é bloqueante em revisão.**

1. **Offline-first:** a tela lê e escreve sempre no Dexie; o sync roda por trás, via outbox.
2. **UUID v7 gerado no cliente** e escrita idempotente no servidor.
3. **Todo dado de negócio tem `farm_id`** e, acima, `organization_id`.
4. **Números são calculados no banco/código, nunca pela IA.** A IA só interpreta.
5. **Duas datas em todo lançamento financeiro:** `accrual_date` e `cash_date`.
6. **Operador nunca recebe dado financeiro** — nem na API, nem no sync, nem no device.
7. **A IA sugere e levanta hipóteses; não prescreve** defensivo nem dose.
8. **Mobile-first e uso no campo:** alvo de toque ≥ 44 px, alto contraste, poucos campos.
9. **Nenhum dado de negócio fora do Cloud SQL.** Cloudflare é borda; R2 só PMTiles.
10. **Licenças respeitadas** — o uso é comercial. Mapa base próprio do Sentinel-2.
11. **Histórico importado é marcado** com `source = 'import'` e lote reversível.

## Fluxo SDD

1. **Descobrir** — entender o problema com quem usa. Nada de código.
2. **Spec** — `/spec-new <nome>` cria `specs/features/NNN-slug/spec.md`. Critérios de
   aceite em Dado/Quando/Então, incluindo obrigatoriamente `CA-OFF` (offline) e `CA-OP`
   (operador). **A spec é aprovada por um humano antes de seguir.**
3. **Plano** — `/spec-plan <NNN>` gera `plan.md` e `tasks.md` e chama o `arquiteto`.
4. **Implementar** — `/implement <NNN> <task>`, uma task por vez, com teste.
5. **Revisar** — `/review <NNN>` roda `spec-reviewer`, `clean-code-reviewer`,
   `security-reviewer` e `sync-auditor`.
6. **Fechar** — `/release-check`, PR pelo template, `doc-writer` atualiza a documentação.

Decisão de arquitetura que surgir no caminho vira **ADR** (`/adr <título>`) — não vira
comentário no código.

## Convenções

**Idioma:** documentação, specs e ADRs em **pt-BR**. Código, tabelas, colunas, variáveis
e rotas em **inglês**. Termo de domínio sem boa tradução (talhão, safra, GTA) usa o nome
em inglês definido no `specs/glossario.md` — consulte antes de nomear qualquer coisa.

**Commits:** Conventional Commits, em inglês, curtos.
`feat(cattle): add pregnancy check endpoint` · tipos: `feat`, `fix`, `docs`, `chore`,
`refactor`, `ci`, `test`, `build`. **Sem `Co-Authored-By`.**

**Branches:** `feat/NNN-slug`, `fix/slug`, `chore/slug`.

**Nunca** fazer `git push` nem usar `--force` sem confirmação explícita.

**Dinheiro** é `numeric(14,2)` no banco e inteiro em centavos no TypeScript. Nunca
`float`. **Datas** de negócio em `date`; instantes em `timestamptz`.

**Migração aplicada é imutável** — correção vem em migração nova (hook bloqueia a edição).

## Onde está cada coisa

| Preciso de…                         | Vou em…                           |
| ----------------------------------- | --------------------------------- |
| Princípio, regra que não se quebra  | `specs/constitution.md`           |
| Como chamar algo no código          | `specs/glossario.md`              |
| Como os serviços se encaixam        | `specs/arquitetura.md`            |
| O que vem em qual fase              | `specs/roadmap.md`                |
| Por que foi decidido assim          | `specs/adr/`                      |
| O que uma feature precisa entregar  | `specs/features/NNN-slug/spec.md` |
| Regra de código por área            | `.claude/rules/`                  |
| Conhecimento profundo de um assunto | `.claude/skills/`                 |
| Especialista para uma tarefa        | `.claude/agents/`                 |
| Atalho de fluxo                     | `.claude/commands/`               |

## Como trabalhar aqui

- **Na dúvida, consulte `specs/` antes de decidir.** Se a resposta não estiver lá, a
  dúvida é real: pergunte, não invente.
- **Não invente regra de negócio.** Gado, café e contabilidade rural têm regras que só o
  produtor e o contador conhecem. Chute vira retrabalho e erro de cálculo.
- **Verifique antes de afirmar que está pronto.** Rode o teste, rode o build, olhe a
  saída. "Deve funcionar" não conta (`superpowers:verification-before-completion`).
- **Uma task por vez**, com teste, seguindo `tasks.md`.
- **Prefira editar o que existe** a criar arquivo novo. Não crie README nem documentação
  que ninguém pediu.
- **Toda rota nova** precisa de checagem de perfil e de fazenda. Sem exceção.
- **Toda tela nova** precisa funcionar offline e ser usável com uma mão, no sol.
- Este é um projeto **agêntico**: se um subagente ou skill cobre a tarefa, use.
