# fmc-system

Sistema de gestão rural multipropriedade — **FMC Gestão Agrícola** (nome provisório).

Gado, café, lavouras eventuais e custos de 5 fazendas, em um app mobile-first que
**funciona sem internet** e sincroniza quando o sinal volta.

> **Documentação:** [`CLAUDE.md`](./CLAUDE.md) para o dia a dia ·
> [`specs/`](./specs/) para constitution, glossário, arquitetura, roadmap e ADRs.

---

## Requisitos

| Ferramenta       | Versão    |
| ---------------- | --------- |
| Node.js          | ≥ 20      |
| pnpm             | ≥ 9       |
| Docker + Compose | ≥ 24 / v2 |
| GNU Make         | qualquer  |

## Começando

```bash
git clone <repo> && cd fmc-system
cp .env.example .env          # e por app: apps/*/.env.example
pnpm install
make up                       # sobe a stack completa em Docker
make health                   # confere a saúde de todos os serviços
```

O primeiro `make up` é lento: as imagens são construídas do zero e o container do
emulador de autenticação precisa de JRE. Os seguintes usam cache.

Se uma porta estiver ocupada por outro projeto, ajuste a variável correspondente no
`.env` e rode `make up` de novo.

## Serviços locais

| Serviço   | URL                                          | O que é                                            |
| --------- | -------------------------------------------- | -------------------------------------------------- |
| `web`     | http://localhost:3010                        | PWA Next.js                                        |
| `edge`    | http://localhost:8787                        | Cloudflare Worker (proxy reverso da API)           |
| `api`     | http://localhost:3011                        | Fastify · saúde em `/health`                       |
| `db`      | `postgres://fmc:changeme@localhost:5442/fmc` | Postgres 16 + PostGIS                              |
| `auth`    | http://localhost:9098                        | Firebase Auth Emulator                             |
| `storage` | http://localhost:9000                        | SeaweedFS, API S3 (stand-in de Cloud Storage e R2) |
| `mail`    | http://localhost:8026                        | Mailpit (caixa de entrada de teste)                |

As portas publicadas no host são configuráveis no `.env` (`WEB_HOST_PORT`,
`API_HOST_PORT`, `DB_HOST_PORT`, …). Os defaults evitam as portas mais disputadas
(3000, 3001, 5432, 9099, 8025). Dentro da rede do Compose os serviços usam sempre a
porta padrão.

A arquitetura local e a correspondência com produção estão em
[`specs/arquitetura.md`](./specs/arquitetura.md) e no
[ADR-0010](./specs/adr/0010-ambiente-local-completo-em-docker.md).

## Comandos

### Make (Docker)

| Comando         | O que faz                                                       |
| --------------- | --------------------------------------------------------------- |
| `make up`       | Sobe toda a stack (build quando necessário)                     |
| `make down`     | Derruba, preservando os volumes                                 |
| `make clean`    | Derruba e **apaga os volumes** (banco zerado)                   |
| `make logs`     | Segue o log de todos os serviços (`make logs s=api` para um só) |
| `make ps`       | Estado e saúde dos containers                                   |
| `make health`   | Verifica o endpoint de saúde de cada serviço                    |
| `make sh s=api` | Shell dentro de um container                                    |
| `make migrate`  | Aplica as migrações no banco local                              |
| `make seed`     | Popula dados de desenvolvimento                                 |
| `make test`     | Roda os testes dentro dos containers                            |
| `make rebuild`  | Reconstrói as imagens sem cache                                 |

### pnpm (host)

| Comando                           | O que faz                                                           |
| --------------------------------- | ------------------------------------------------------------------- |
| `pnpm dev`                        | Roda todos os apps em modo dev, sem Docker (precisa do banco de pé) |
| `pnpm build`                      | Build de todos os pacotes                                           |
| `pnpm lint`                       | ESLint                                                              |
| `pnpm typecheck`                  | `tsc --noEmit`                                                      |
| `pnpm test`                       | Vitest                                                              |
| `pnpm db:generate`                | Gera migração a partir do schema Drizzle                            |
| `pnpm --filter @fmc/api <script>` | Roda um script num pacote só                                        |

## Estrutura

```
apps/
  web/      PWA Next.js (App Router, export estático, Serwist, Dexie)
  api/      Fastify — monólito modular por domínio
  worker/   jobs batch e agendados
  edge/     Cloudflare Worker (proxy reverso)
packages/
  shared/   schemas Zod, tipos, protocolo de sync
  db/       schema Drizzle e migrations
  ui/       componentes compartilhados
  config/   tsconfig, eslint, prettier, brand
specs/      constitution, glossário, arquitetura, roadmap, ADRs, features
infra/      Terraform + Terragrunt (ainda sem .tf/.hcl — ver ADR-0014)
docker/     Dockerfiles e scripts de inicialização
.claude/    rules, agents, skills, commands, hooks
```

## Como se trabalha aqui

O projeto usa **Spec-Driven Development** com desenvolvimento agêntico. Nada de feature
sem spec aprovada. O fluxo completo está em [`CLAUDE.md`](./CLAUDE.md#fluxo-sdd) e os
atalhos em `.claude/commands/`:

```
/spec-new <nome>      cria a spec da feature
/spec-plan <NNN>      gera plano e tarefas
/implement <NNN> <T>  implementa uma tarefa, com teste
/review <NNN>         revisão consolidada (spec, clean code, segurança, sync)
/adr <título>         registra uma decisão de arquitetura
/status               estado das features
/release-check        checklist antes do deploy
```

## Licença

Software proprietário. Todos os direitos reservados.
