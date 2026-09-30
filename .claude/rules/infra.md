---
paths:
  - 'infra/**'
  - '**/*.hcl'
  - 'apps/edge/**'
  - 'docker/**'
  - 'docker-compose.yml'
  - 'Makefile'
  - '.github/workflows/**'
---

# Regras — Infraestrutura, borda e ambiente local

## Terraform + Terragrunt

**Terraform** define os módulos; **Terragrunt** define as raízes por ambiente e
componente (ADR-0013).

- **Tudo em código.** Recurso criado pelo console é dívida: ou vira código, ou é
  removido.
- **Nenhum `.tf` ou `.hcl` é escrito enquanto a Fase 1 rodar apenas em local**
  (ADR-0014). Infra que não pode ser aplicada não pode ser verificada.
- `snake_case` em todo resource, variable e output.
- Um arquivo por preocupação no módulo: `main.tf`, `variables.tf`, `outputs.tf`,
  `versions.tf`.
- **Módulo não declara `backend` nem `provider`** — os dois são gerados por `generate`
  no `root.hcl`.
- **Chave de estado é derivada do caminho** (`path_relative_to_include()`), nunca
  escrita à mão.
- **Um estado por componente por ambiente.** Estado monolítico é proibido: raio de
  explosão.
- Dependência entre componentes é explícita, via bloco `dependency`, com `mock_outputs`
  para o `plan` funcionar antes do primeiro `apply`.
- Toda `variable` e todo `output` têm `description`.
- **Versão do Terraform e dos providers fixada** no `root.hcl`. Nada de `~>` aberto.
- `terraform fmt` e `terragrunt hclfmt` antes de commitar. O CI checa.
- **Terraform workspaces são proibidos** — ambiente é caminho no disco, não estado de
  sessão.
- `terraform apply`, `terraform destroy`, `terragrunt apply`, `terragrunt destroy` e
  **qualquer `run-all`** exigem confirmação humana explícita. Estão no `deny`.

## Ambientes

Na Fase 1 há **um ambiente de nuvem**: `prod` (`fmc-prod`). O `local` em Docker é o
ambiente de desenvolvimento (ADR-0014).

- **Não use `prod` como rascunho.** Experimento vai para o local.
- Migração destrutiva só vai para `prod` depois de ter sido **aplicada e revertida em
  local**, com confirmação humana e nota no PR.
- `prod` tem **backup diário e PITR** desde o primeiro dia. Ir ao ar sem isso é
  bloqueante.
- **Não remova `dev` nem `staging`** do tipo `AppEnv` nem do `wrangler.toml`: o caminho
  precisa continuar aberto para quando o segundo ambiente entrar.

## Segredos

- Segredo vive no **Secret Manager** (GCP) ou nos **secrets do Worker** (Cloudflare).
  Em lugar nenhum mais.
- **Nunca** em `.tf`, `.tfvars`, `docker-compose.yml`, `.env.example`, log ou teste.
- `.env` real é gitignored. `.env.example` tem só chaves e valores de exemplo óbvios
  (`changeme`, `local-only`).
- Rotação do `X-Edge-Secret` é documentada e testada.

## Custos

- **Label de custo por cliente** em todo recurso que aceite.
- Alerta de orçamento configurado em `fmc-prod` (e em cada ambiente novo que entrar).
- Recurso novo com custo fixo mensal relevante exige nota no PR.
- Um projeto por ambiente, isolado. Nunca compartilhe recurso entre eles — IAM,
  secrets, quotas e faturamento separados.

## Cloudflare Worker (`apps/edge`)

- O Worker é **proxy reverso e nada mais**. Sem lógica de negócio, sem cache de resposta
  de API, sem transformação de payload.
- Ele injeta `X-Edge-Secret`; a API **rejeita com 403** sem o cabeçalho (ADR-0006).
- **Proibido** guardar dado de negócio em KV, D1 ou Durable Objects (constitution §9).
- **R2 só guarda PMTiles.** Nenhum outro conteúdo.
- Sem challenge/CAPTCHA em `/api/*`.
- A URL do Cloud Run não aparece em código de cliente, em documentação pública nem em
  log.

## Ambiente local em Docker (ADR-0010)

- **Todo serviço no Compose tem `healthcheck`.** Serviço sem healthcheck não entra.
- A mesma imagem de aplicação serve local e produção; muda o **target** do build
  multi-stage (`dev` vs `runtime`), não o Dockerfile.
- Mesma versão maior de Postgres e PostGIS em local e em Cloud SQL.
- **`node_modules` em volumes nomeados**, nunca no bind mount — o pnpm usa links
  simbólicos e os binários nativos do host (macOS) não servem no container (Linux).
- **Proibido `if (process.env.NODE_ENV === 'development')` em código de domínio.** Só
  `@fmc/config` lê o ambiente; o resto recebe a dependência já resolvida.
- Todo stand-in local (SeaweedFS, emulador de auth, Mailpit) fica atrás da **mesma
  interface** do serviço de produção.
- `make up` precisa deixar **todos** os serviços saudáveis. Isso é parte da definição de
  pronto.

## Docker

- **Multi-stage** sempre. A imagem final não carrega toolchain de build.
- Base slim ou distroless na imagem de runtime.
- **Nunca rodar como root** na imagem de runtime. Usuário sem privilégio, explícito.
- Tag de imagem **nunca** é `latest`. Use o SHA do commit.
- `.dockerignore` cobrindo `node_modules`, `.git`, `.next`, `dist`, `.env`.

## CI

- Pipeline: `install` → `lint` → `typecheck` → `test` → `build`.
- O CI sobe o Compose e roda o smoke de saúde antes de considerar o build verde.
- Deploy para **prod** exige aprovação manual. Está no `deny` das permissões.

## Scripts

- Bash: `set -euo pipefail` na primeira linha útil.
- Python: type hints, f-strings, sem `print` em produção.
