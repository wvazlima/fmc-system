---
name: gcp-deploy
description: Google Cloud do projeto — Cloud Run, Cloud SQL, Secret Manager, Cloud Storage, Scheduler, ambientes, custos e labels. Use ao escrever Terraform ou Terragrunt para GCP, configurar deploy, ajustar recurso de nuvem, investigar custo, ou ao decidir onde algo deve rodar.
---

# Deploy no Google Cloud

O núcleo é Google Cloud; a borda é Cloudflare (ADR-0006). Tudo em Terraform
(`infra/terraform/`).

## Projetos

Na Fase 1 há **um ambiente de nuvem** (ADR-0014):

| Ambiente | Projeto    | Banco                          | Observação                      |
| -------- | ---------- | ------------------------------ | ------------------------------- |
| `local`  | —          | container `postgis` (ADR-0010) | é o ambiente de desenvolvimento |
| `prod`   | `fmc-prod` | Cloud SQL com **HA e PITR**    | dado real                       |

`dev` e `staging` entram quando uma das condições de disparo do ADR-0014 aparecer:
dado real em produção, migração destrutiva a ensaiar, janela de release, ou segundo
cliente. Cada ambiente novo é **um projeto GCP isolado** — nada compartilhado — e um
diretório novo em `environments/` (ADR-0013).

**Consequência prática de ter um ambiente só:** não há onde ensaiar `apply` nem
migração antes de prod. Por isso `terraform plan` é obrigatório e revisado, migração
destrutiva precisa ter sido aplicada e revertida em local, e o deploy de Cloud Run usa
**revisão com 0% de tráfego** antes de promover.

## Cloud Run — `api`

- Região **`southamerica-east1`** (São Paulo): latência e residência de dado.
- **Não aceita tráfego público direto.** Só requisição com `X-Edge-Secret` válido,
  injetado pelo Worker de borda. A URL `*.run.app` não é divulgada (ADR-0006).
- `min-instances`: `1` em prod (evita cold start no primeiro sync da manhã); `0` em
  qualquer ambiente futuro que não seja produção.
- `max-instances` com teto explícito — é a trava contra conta surpresa.
- Concorrência padrão (80) serve; a carga é I/O de banco, não CPU.
- Conexão ao Cloud SQL pelo **conector do Cloud SQL**, nunca por IP público.
- Health check em `/health`, que só responde 200 se o banco respondeu.
- Imagem no **Artifact Registry**, tag pelo **SHA do commit**. Nunca `latest`.

## Cloud Run Jobs — `worker`

- Jobs disparados por **Cloud Scheduler**. Job é idempotente: rodar duas vezes não
  duplica efeito.
- Timeout explícito e generoso; importação de planilha grande demora.
- Job pesado não roda no caminho de deploy.
- Fila via **Cloud Tasks** ou **Pub/Sub** quando houver trabalho sob demanda.

## Cloud SQL

- **PostgreSQL 16 com PostGIS** — a mesma versão maior do container local (ADR-0010).
- Prod: **HA regional** e **PITR** ligado, com backup diário e retenção definida.
  Como não há ambiente de ensaio (ADR-0014), isto é a rede de segurança — subir sem
  isso é bloqueante.
- **Sem IP público.** Acesso por IP privado ou conector.
- Usuário da aplicação com privilégio mínimo — não é `postgres`.
- Migração roda como passo de deploy separado, antes de apontar o tráfego para a
  revisão nova.

## Secret Manager

- **Todo segredo aqui.** Nunca em `.tf`, `.tfvars`, variável de ambiente literal, imagem
  ou log.
- O Cloud Run lê secret por referência, montado como variável na revisão.
- Versionamento ligado; rotação documentada.
- A conta de serviço tem acesso **só aos secrets que usa**.

## Cloud Storage

- Bucket por ambiente, **acesso uniforme** e público desativado.
- Foto e áudio dos lançamentos. **URL assinada** com validade curta para leitura.
- Regra de ciclo de vida para original de importação (mantenha — quando o layout do
  terceiro mudar, você vai precisar dele).

## Observabilidade

- **Cloud Logging** com log estruturado em JSON. **Nunca** logue CPF, valor financeiro,
  e-mail ou token.
- **Error Reporting** ligado; alerta para erro novo em prod.
- Alerta de latência e de taxa de erro da API.

## Custos — o que realmente pesa

| Item                         | Ordem de grandeza | Como controlar                                     |
| ---------------------------- | ----------------- | -------------------------------------------------- |
| Cloud SQL com HA             | o maior item fixo | tamanho da instância; HA só em prod                |
| Cloud Run `min-instances: 1` | fixo, pequeno     | `0` em qualquer ambiente que não seja prod         |
| Egress de imagem e mapa      | variável          | **PMTiles no R2**, que não cobra egress (ADR-0006) |
| Cloud Logging                | cresce sozinho    | retenção curta; não logue o que não lê             |

- **Label de custo por cliente** em todo recurso que aceite. É o que torna o SaaS
  faturável depois.
- **Alerta de orçamento** em todo projeto, começando por `fmc-prod`.
- Recurso novo com custo fixo mensal relevante: diga quanto custa **antes** de criar.

## Deploy

```
CI: install → lint → typecheck → test → build → compose up + smoke
    → build da imagem → push no Artifact Registry
    → migração → deploy da revisão → health check
```

`terraform apply`, `terraform destroy` e deploy para **prod** exigem **confirmação
humana explícita**. Estão no `deny` das permissões.
