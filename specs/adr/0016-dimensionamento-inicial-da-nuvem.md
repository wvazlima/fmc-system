# ADR-0016 · Dimensionamento inicial da nuvem: menor banco, sem instância quente, já em São Paulo

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-30 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O levantamento de custo de 2026-09-30
(`specs/levantamento/2026-09-30-custo-de-operacao.md`) mostrou que, nesta escala —
12 usuários, ~10 mil requisições/dia, base abaixo de 20 GB — **quase tudo cabe no free
tier**: Cloud Run (2 milhões de req/mês), Identity Platform (50 mil usuários ativos),
Cloudflare Pages, Workers, R2, Logging e Scheduler.

**O Cloud SQL é a única exceção: não tem free tier e cobra parado.** É ele que define a
conta.

Três variáveis decidem o custo, e elas pesam de forma muito diferente:

| Variável                                | Diferença por mês |
| --------------------------------------- | ----------------- |
| `db-f1-micro` → `db-g1-small`           | **R$ 116**        |
| `min-instances: 0` → `1` no Cloud Run   | **R$ 110 a 325**  |
| `us-central1` → `southamerica-east1`    | **R$ 14**         |

O ADR-0014 é o que torna a terceira linha importante: na Fase 1 existe **um único
ambiente de nuvem, e ele se chama `prod`**. Não há "ambiente de testes" separado — a
instância criada agora é a mesma que vai receber as planilhas importadas e os
lançamentos das cinco fazendas.

Tier de banco e `min-instances` se mudam a qualquer momento. **Região, não:** Cloud SQL
não muda de região. Trocar depois significa criar instância nova, dump, restore,
janela de parada e reapontamento — barato com o banco vazio, caro com dado real dentro.

## Decisão

A nuvem começa **no menor tamanho que funciona, na região definitiva**:

| Item                        | Valor inicial                                      |
| --------------------------- | --------------------------------------------------- |
| Região                      | **`southamerica-east1`** (São Paulo), desde o início |
| Cloud SQL                   | **`db-f1-micro`**, zonal, sem HA                    |
| Cloud Run (`api`, `worker`) | **`min-instances: 0`**                              |
| Cloudflare                  | plano free (Pages, Workers, R2)                     |
| Identity Platform           | free tier                                           |

Custo estimado: **~US$ 19/mês (~R$ 104/mês)**.

A região fica fixa porque é a única das três que não se corrige depois. Os R$ 14/mês
que o `us-central1` economizaria não pagam uma migração de banco com as fazendas em
uso — e evitam transferência internacional de dado pessoal, que exigiria cláusula
própria de LGPD no contrato.

### Gatilhos de promoção

Cada degrau sobe quando o sinal aparecer, não por calendário:

| Degrau                                | Quando                                                                                                                                | Custo adicional |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `db-f1-micro` → `db-g1-small`         | memória sustentada acima de ~80%; consulta PostGIS morrendo por falta de memória; **ou antes da importação do histórico (feature `013`)**, que é a maior carga da Fase 1 | +R$ 116/mês     |
| `min-instances: 0` → `1`              | quando o cold start incomodar o **escritório** — o primeiro envio do dia, a tela de digitação em série (ADR-0015)                      | +R$ 110 a 325/mês |
| Zonal → **HA**                        | no go-live nas fazendas, quando existir dado real cuja perda seja cara — mesmo gatilho do ADR-0014 para o segundo ambiente             | dobra o banco   |
| Ambiente `staging`                    | conforme ADR-0014                                                                                                                      | +1 Cloud SQL    |

Mudar tier de Cloud SQL é alteração de uma linha no Terragrunt com restart de poucos
minutos. `min-instances` não tem parada.

## Alternativas consideradas

### `us-central1`, para alcançar o free tier dos Estados Unidos

- **A favor:** o "always free" de Compute Engine (uma `e2-micro`) e os 5 GB de Cloud
  Storage só valem em `us-west1`, `us-central1` e `us-east1`. Mais ~20% de desconto em
  tudo. Economia de R$ 14/mês.
- **Contra:** não usamos `e2-micro` (o banco é gerenciado, ADR-0005) e 5 GB de Storage
  custam centavos em São Paulo — ou seja, **o free tier americano quase não se aplica a
  esta stack**. Em troca: +150 ms de latência, dado pessoal fora do Brasil e uma
  migração de região inevitável.
- **Por que não:** paga-se o risco inteiro por R$ 14 ao mês.

### `db-g1-small` desde o início

- **A favor:** 1,7 GB de RAM dá folga real para o PostGIS; nenhuma surpresa de memória.
- **Contra:** R$ 116/mês desde o primeiro dia, antes de existir usuário.
- **Por que não:** é justamente o degrau mais fácil de subir depois — e o gatilho já
  está definido. Pagar antes do sinal é pagar por seguro que o restart de cinco minutos
  já dá.

### Postgres próprio numa `e2-micro` do free tier

- **A favor:** custo zero de instância.
- **Contra:** sem backup gerenciado, sem PITR, sem patch automático; contraria o
  ADR-0005; e é dado financeiro de cliente pagante.
- **Por que não:** economizar US$ 8/mês colocando a contabilidade de cinco fazendas num
  banco sem backup gerenciado não é economia.

## Consequências

**Positivas**

- Custo de operação de ~R$ 104/mês contra uma mensalidade de R$ 1.200 — margem que
  sustenta o preço de fundador.
- Nenhuma migração de região no futuro.
- Dado pessoal permanece no Brasil; uma cláusula a menos no contrato.
- Cada degrau de custo tem gatilho escrito, em vez de virar decisão no susto.

**Negativas e custos aceitos**

- `db-f1-micro` tem **0,6 GB de RAM** e o PostGIS é pesado. É apertado e pode faltar
  memória em consulta de geometria ou na importação. Aceito conscientemente, com o
  gatilho de upgrade já definido.
- Tiers de núcleo compartilhado (`f1-micro`, `g1-small`) **não têm SLA do Cloud SQL**.
- Com `min-instances: 0` há cold start de 1 a 2 segundos. Tolerável porque o PWA é
  offline-first: a tela lê e escreve no Dexie e não espera a rede (constitution §1).

**O que passa a ser proibido**

- Criar recurso em região diferente de `southamerica-east1` sem novo ADR.
- Subir `min-instances` ou tier "para garantir", sem o gatilho correspondente.
- Guardar dado de negócio fora do Cloud SQL para fugir de custo (constitution §9).

## Como verificar que a decisão está sendo respeitada

- Região, tier e `min-instances` são variáveis explícitas no Terragrunt (ADR-0013);
  revisão de PR em `infra/` confere contra esta tabela.
- **Alerta de orçamento** no projeto `fmc-prod`, conforme a skill `gcp-deploy`: um
  aumento inesperado aparece como alerta, não na fatura.
- O agente `infra-cloud` valida alteração em `infra/` contra este ADR.
