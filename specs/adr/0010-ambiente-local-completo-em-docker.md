# ADR-0010 · Ambiente local completo em Docker Compose

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

A arquitetura-alvo é Google Cloud + Cloudflare. Mas o desenvolvimento precisa rodar na
máquina, inteiro, por três motivos:

- **Custo e velocidade:** subir Cloud SQL e Cloud Run a cada iteração é caro e lento.
- **Desenvolvimento agêntico:** o agente precisa de um ciclo fechado — mudar, rodar,
  testar, ver o resultado — sem depender de credencial de nuvem nem de deploy.
- **Verificação honesta:** "funciona" só vale se algo foi executado. O ambiente local
  é onde  ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  No package.json (or package.yaml, or package.json5) was found in "/Users/wellingtonlima/Documents/repos/work/fmc-system". e o smoke de saúde de cada serviço rodam de verdade.

O risco é o clássico: um ambiente local que diverge de produção e esconde bugs até o
deploy.

## Decisão

O ambiente local é a **stack completa em Docker Compose**, e cada serviço gerenciado do
GCP tem um **stand-in local atrás da mesma interface**. A troca é por **variável de
ambiente**, nunca por `if (isLocal)` espalhado pelo código.

| Produção                          | Local                              | Como a troca acontece                          |
| --------------------------------- | ---------------------------------- | ---------------------------------------------- |
| Cloud SQL (Postgres + PostGIS)    | `postgis/postgis:16-3.4`           | `DATABASE_URL`                                 |
| Identity Platform / Firebase Auth | Firebase Auth Emulator             | `FIREBASE_AUTH_EMULATOR_HOST` (ADR-0012)       |
| Cloud Storage                     | SeaweedFS (API S3)                 | adaptador `ObjectStorage` + `STORAGE_ENDPOINT` |
| Cloudflare R2                     | SeaweedFS, bucket separado         | mesmo adaptador `ObjectStorage`                |
| Cloudflare Worker                 | `wrangler dev` no container `edge` | mesmo `apps/edge/src/index.ts`                 |
| Cloud Run Jobs + Scheduler        | container `worker` em loop         | mesmo `apps/worker/src`                        |
| envio de e-mail                   | Mailpit                            | `SMTP_*`                                       |
| Secret Manager                    | `.env` local, não versionado       | leitor de config em `@fmc/config`              |

Regras que sustentam a paridade:

1. **A mesma imagem de aplicação** é usada em local e em produção — muda o alvo do
   build multi-stage (`dev` vs `runtime`), não o Dockerfile.
2. **Mesma versão maior** de Postgres e PostGIS em local e em Cloud SQL.
3. Nenhum código de domínio conhece o ambiente. Só `@fmc/config` lê `NODE_ENV` e
   `APP_ENV`.
4. Toda migração é aplicada e revertida em local antes de ir para dev.
5. `docker compose up` precisa deixar **todos** os serviços saudáveis. Healthcheck em
   cada um é parte da definição de pronto.

## Alternativas consideradas

### Só o banco em Docker; apps rodando no host

- **A favor:** iteração mais rápida, sem rebuild de imagem, sem camada de volume.
- **Contra:** o Worker de borda e o encadeamento `web → edge → api` nunca são exercitados
  em conjunto; diferenças de sistema operacional e de binário nativo aparecem só no CI.
- **Por que não:** o caminho `edge → api` com o cabeçalho secreto é exatamente onde erra
  fácil e dói caro. Precisa ser testável localmente.

### Emuladores do Google Cloud (Cloud SQL Proxy contra instância real, emulador de Storage)

- **A favor:** mais perto de produção em alguns pontos.
- **Contra:** não existe emulador oficial de Cloud Run nem de Cloud SQL; exigiria conta
  e credencial de nuvem para desenvolver.
- **Por que não:** quebra o requisito de ciclo fechado e offline.

### Ambiente de desenvolvimento remoto (Codespaces, dev na nuvem)

- **A favor:** paridade quase perfeita.
- **Contra:** custo recorrente e dependência de conexão.
- **Por que não:** desnecessário para o porte do time.

## Consequências

**Positivas**

- Um comando (`make up`) sobe o sistema inteiro; um agente consegue verificar o que
  fez sem credencial de nuvem.
- O caminho `web → edge → api → db` é exercitado desde o primeiro dia.
- Onboarding: clonar, `make up`, funcionando.

**Negativas e custos aceitos**

- Build inicial das imagens é lento (o container do emulador Firebase precisa de JRE).
  Mitigado por cache de camada e volumes nomeados.
- O pnpm usa links simbólicos; `node_modules` precisa ficar em **volumes nomeados**, e
  não no bind mount, para não misturar binários nativos do host (macOS) com os do
  container (Linux).
- O SeaweedFS não é Cloud Storage nem R2. Diferenças de política de acesso e de URL assinada
  só aparecem em `dev`. Por isso o adaptador `ObjectStorage` tem teste de contrato nos
  dois.

**O que passa a ser proibido**

- `if (process.env.NODE_ENV === 'development')` dentro de código de domínio.
- Serviço no compose sem `healthcheck`.
- Dependência local que não exista em produção sob outra forma.
- Segredo real em `docker-compose.yml` ou em `.env.example`.

## Como verificar que a decisão está sendo respeitada

`make up` + `make health` no fluxo de `/release-check`; `.claude/rules/infra.md`; CI
sobe o compose e roda o smoke test; agente `infra-cloud`.
