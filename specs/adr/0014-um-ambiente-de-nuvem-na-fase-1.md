# ADR-0014 · Um ambiente de nuvem na Fase 1: local é o dev

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O escopo inicial previa **três projetos GCP**: `dev`, `staging` e `prod`.

Ao detalhar a infraestrutura, dois fatos mudaram a conta:

1. **O ambiente local é a stack completa** (ADR-0010), não apenas um banco. O caminho
   `web → edge → api → db` é exercitado inteiro na máquina, com o mesmo Postgres +
   PostGIS, o mesmo Worker de borda com o cabeçalho secreto, o mesmo fluxo de token e
   os mesmos adaptadores de storage. Um `dev` na nuvem repetiria isso cobrando por hora.
2. **O custo de um ambiente é dominado pelo Cloud SQL**, que roda 24×7 e cobra parado.
   Cloud Run com `min-instances: 0` custa quase nada sem uso; banco, não.

Durante a Fase 1 há **um cliente**, nenhuma base de produção a proteger e nenhuma
cadência de release estabelecida.

## Decisão

A Fase 1 tem **um único ambiente de nuvem**:

| Ambiente | Onde roda      | Papel                                                               |
| -------- | -------------- | ------------------------------------------------------------------- |
| `local`  | Docker Compose | **É o ambiente de desenvolvimento.** Onde se codifica e se verifica |
| `prod`   | GCP `fmc-prod` | O sistema em uso pelas fazendas                                     |

**`dev` e `staging` na nuvem não são descartados — são adiados.** Um segundo ambiente
entra quando **qualquer** destas condições aparecer:

- **existe dado real em produção** cuja perda ou corrupção seria cara (na prática, a
  partir do go-live nas fazendas, semana 14 do cronograma);
- uma **migração destrutiva** precisa ser ensaiada antes de ir para prod;
- a cadência de release deixa de ser "quando estiver pronto" e passa a ter janela;
- entra o **segundo cliente** (SaaS), quando o isolamento operacional vira requisito.

O tipo `AppEnv` em `packages/config` **continua aceitando `dev` e `staging`**, e o
`wrangler.toml` mantém as entradas. O layout do Terragrunt (ADR-0013) é por diretório:
acrescentar um ambiente é criar `environments/<nome>/` com seu `env.hcl`. Nenhuma
linha de código de aplicação muda.

## Alternativas consideradas

### Três ambientes, como no escopo original

- **A favor:** ensaio de release desde o primeiro deploy; prática padrão da indústria;
  não existe o momento constrangedor de "precisamos de staging agora e não temos".
- **Contra:** duas instâncias de Cloud SQL a mais rodando durante as 16 semanas da Fase
  1, para ambientes que receberiam pouquíssimo uso — o ensaio real está acontecendo no
  Docker local, que é fiel o bastante (ADR-0010).
- **Por que não:** custo recorrente sem contrapartida no período, e barato de reverter
  depois: um diretório no Terragrunt.

### Dois ambientes: `dev` na nuvem + `prod`

- **A favor:** um lugar na nuvem para exercitar `terraform apply` e migração antes de
  prod. Cobre exatamente a lacuna que esta decisão assume.
- **Contra:** enquanto prod não tem dado real, `dev` na nuvem é redundante com o local
  — os dois teriam dado fictício e nenhum dos dois protege nada.
- **Por que não:** a lacuna só passa a doer **depois** do go-live. É nesse momento que a
  condição de disparo acima cria o ambiente, e não antes. Esta é a alternativa mais
  forte, e é para ela que caminhamos.

### Um projeto GCP com dois bancos, simulando dois ambientes

- **A favor:** economiza projeto.
- **Contra:** não economiza banco, e quebra o isolamento: IAM, secrets, quotas e
  faturamento passam a ser compartilhados, e um erro de configuração alcança prod.
- **Por que não:** contraria a razão de separar ambientes.

## Consequências

**Positivas**

- Dois Cloud SQL a menos durante a Fase 1.
- Menos superfície de Terraform e de configuração para manter enquanto o produto ainda
  está mudando de forma.
- A verificação acontece onde é rápida e barata: `make up` e `make check`.

**Negativas e custos aceitos**

- **Não há onde ensaiar `terraform apply` nem migração destrutiva antes de prod.** É o
  custo central desta decisão. Mitigações:
  - enquanto prod não tem dado real, **prod é o ensaio** — não há o que perder;
  - `terraform plan` é obrigatório e revisado antes de todo `apply`;
  - migração destrutiva exige ter sido **aplicada e revertida em local**, confirmação
    humana e nota no PR (`.claude/rules/db.md`);
  - Cloud SQL em prod tem **backup diário e PITR** desde o primeiro dia;
  - deploy de Cloud Run usa **revisão com 0% de tráfego** antes de promover.
- Existe o risco de o segundo ambiente nunca ser criado por inércia. Por isso as
  condições de disparo estão escritas acima e `/release-check` as verifica a cada
  release.

**O que passa a ser proibido**

- Usar `prod` como rascunho: experimento vai para o local.
- Aplicar migração destrutiva em `prod` sem tê-la aplicado **e revertido** em `local`.
- Ir para produção sem backup e PITR configurados no Cloud SQL.
- Remover `dev` ou `staging` do tipo `AppEnv` ou do `wrangler.toml` — o caminho
  precisa continuar aberto.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/infra.md`; skill `gcp-deploy`; agente `infra-cloud`; `/release-check`
inclui a checagem das condições de disparo do segundo ambiente e a confirmação de
backup e PITR.
