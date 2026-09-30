# Infraestrutura

**Terraform** define os módulos; **Terragrunt** define as raízes por ambiente e
componente ([ADR-0013](../../specs/adr/0013-terragrunt-sobre-terraform.md)).

> **Ainda não há nenhum `.tf` nem `.hcl` aqui, e isso é deliberado.**
> A Fase 1 roda inteiramente no ambiente local em Docker
> ([ADR-0010](../../specs/adr/0010-ambiente-local-completo-em-docker.md)). Escrever
> infra de nuvem agora produziria código que ninguém consegue aplicar nem verificar —
> `terraform plan` precisa de projeto, credencial e backend remoto. Os arquivos nascem
> quando o ambiente de nuvem existir
> ([ADR-0014](../../specs/adr/0014-um-ambiente-de-nuvem-na-fase-1.md)).
>
> O que existe agora é a **estrutura e as regras**, que são o que custa caro mudar
> depois.

## Layout

```
infra/terraform/
├── modules/                      # módulos Terraform reutilizáveis (.tf)
│   ├── cloud_run_service/
│   ├── cloud_sql_postgis/
│   ├── cloud_storage/
│   ├── cloudflare_edge/
│   └── ...
├── root.hcl                      # backend, providers e locals comuns (gerados)
└── environments/
    └── prod/
        ├── env.hcl               # project_id, região, labels do ambiente
        ├── network/terragrunt.hcl
        ├── database/terragrunt.hcl
        ├── storage/terragrunt.hcl
        ├── api/terragrunt.hcl
        └── edge/terragrunt.hcl
```

**Um ambiente novo é um diretório novo** em `environments/`, com seu `env.hcl`. Nenhum
módulo muda.

## Ambientes

| Ambiente | Onde roda      | Papel                                          |
| -------- | -------------- | ---------------------------------------------- |
| `local`  | Docker Compose | **É o ambiente de desenvolvimento** (ADR-0010) |
| `prod`   | GCP `fmc-prod` | O sistema em uso pelas fazendas                |

`dev` e `staging` entram quando uma das condições de disparo do ADR-0014 aparecer:
dado real em produção, migração destrutiva a ensaiar, janela de release, ou segundo
cliente.

## Providers

| Provider     | Responsabilidade                                                                             |
| ------------ | -------------------------------------------------------------------------------------------- |
| `google`     | Cloud Run, Cloud SQL, Cloud Storage, Secret Manager, Artifact Registry, Cloud Scheduler, IAM |
| `cloudflare` | DNS, WAF, TLS, Pages, Workers, R2                                                            |

## Regras

- `snake_case` em todo resource, variable e output; `description` em toda variable e
  output.
- **Módulo não declara `backend` nem `provider`** — gerados por `generate` no
  `root.hcl`.
- **Chave de estado derivada do caminho** (`path_relative_to_include()`), nunca escrita
  à mão.
- **Um estado por componente por ambiente.** Estado monolítico é proibido: raio de
  explosão.
- Dependência entre componentes via bloco `dependency`, com `mock_outputs` para o
  `plan` funcionar antes do primeiro `apply`.
- **Versão do Terraform e dos providers fixada** no `root.hcl`.
- **Terraform workspaces são proibidos** — ambiente é caminho no disco, não estado de
  sessão.
- `terraform fmt` e `terragrunt hclfmt` antes de commitar. O CI checa.
- **Label de custo por cliente** em todo recurso que aceite; alerta de orçamento no
  projeto.
- Segredo **só** no Secret Manager ou nos secrets do Worker. Nunca em `.tf`, `.hcl` ou
  `.tfvars`.

## Comandos destrutivos

`terraform apply`, `terraform destroy`, `terragrunt apply`, `terragrunt destroy` e
**qualquer `run-all`** exigem **confirmação humana explícita** e estão no `deny` de
`.claude/settings.json`. O agente não os executa sozinho.

Como não há ambiente de ensaio (ADR-0014), `terraform plan` é obrigatório e revisado
antes de todo `apply`.
