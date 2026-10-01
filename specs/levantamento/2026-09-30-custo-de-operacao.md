# Custo de operação de um cliente — 2026-09-30

Quanto custa manter **as cinco fazendas do piloto** rodando, usando o máximo de free
tier. Preços levantados em 2026-09-30; câmbio de referência **R$ 5,40**.

Premissas de uso: 10 a 12 usuários, ~10 mil requisições/dia (a secretária digitando em
série mais o sync dos operadores), base de dados abaixo de 20 GB, fotos e áudios em
storage, PMTiles das 5 fazendas no R2.

---

## O que é grátis e continua grátis nesta escala

| Serviço                       | Free tier                                                  | Nosso uso                        |
| ----------------------------- | ---------------------------------------------------------- | -------------------------------- |
| **Cloud Run** (api + worker)  | 180.000 vCPU-s, 360.000 GiB-s e **2 milhões de req/mês**   | ~60.000 vCPU-s e 300 mil req ✅   |
| **Identity Platform**         | **50.000 usuários ativos/mês**                             | 12 usuários ✅                    |
| **Cloudflare Pages** (PWA)    | sites e **banda ilimitados**, 500 builds/mês               | ✅                                |
| **Cloudflare Workers** (edge) | **100.000 req/dia**                                        | ~10 mil/dia ✅                     |
| **Cloudflare R2** (PMTiles)   | 10 GB e **egress zero, sempre**                            | mapas das 5 fazendas ✅           |
| **Cloud Logging**             | 50 GB/mês                                                  | ✅ com retenção curta             |
| **Cloud Scheduler**           | 3 jobs                                                     | ✅                                |
| **Secret Manager**            | 6 versões ativas, 10 mil acessos/mês                       | ⚠️ passamos de 6 segredos (~US$1) |

**Cloud Run só fica grátis com `min-instances: 0`.** Com uma instância sempre quente, a
conta sai de zero para a faixa de US$ 20 a 60/mês — o item mais caro depois do banco.
E aqui a arquitetura ajuda: sendo **offline-first**, a tela lê e escreve no Dexie e não
espera a rede (constitution §1). O cold start de 1 a 2 segundos cai no sync, onde
ninguém está olhando. **`min-instances: 0` é a escolha certa, não um remendo.**

## O que não tem free tier: o banco

Cloud SQL é o único custo fixo que não some. **Não existe free tier de Cloud SQL.**

| Configuração                          | Instância  | +20 GB SSD | +backup   | Total/mês   |
| ------------------------------------- | ---------- | ---------- | --------- | ----------- |
| `db-f1-micro` — 0,6 GB, **sem SLA**   | US$ 7,67   | US$ 3,40   | US$ 1,60  | **US$ 12,67** |
| `db-g1-small` — 1,7 GB, **sem SLA**   | US$ 25,55  | US$ 3,40   | US$ 1,60  | **US$ 30,55** |

Tiers de núcleo compartilhado (`f1-micro`, `g1-small`) **não são cobertos pelo SLA do
Cloud SQL**. Para um piloto, aceitável. Para o décimo cliente, não.

## Três cenários

| Cenário                                                     | US$/mês | R$/mês | R$/ano |
| ----------------------------------------------------------- | ------- | ------ | ------ |
| **A · mínimo** — us-central1, `f1-micro`, `min-instances: 0` | ~15     | **~79**  | ~950   |
| **B · recomendado** — São Paulo, `g1-small`, `min: 0`        | ~40     | **~214** | ~2.570 |
| **C · robusto** — São Paulo, `g1-small` **com HA**, `min: 1` | ~102    | **~553** | ~6.630 |

O cenário B inclui o prêmio de preço da região de São Paulo (~20%).

**Recomendação: começar no B.** O A economiza R$ 135/mês e cobra por isso em duas
moedas: os dados pessoais saem do Brasil (transferência internacional sob a LGPD, que
precisa estar no contrato) e a latência sobe ~150 ms — que o offline-first absorve, mas
que aparece no sync e nos relatórios.

## O que isso significa para o preço

**A nuvem não é o custo deste negócio.** R$ 214/mês de infraestrutura contra uma
mensalidade de R$ 1.200 deixa margem bruta de 82%.

O custo real é **tempo**: suporte, correção e as 4 h/mês de evolução que a proposta
promete. A R$ 200/hora, isso é **R$ 800/mês** — quase quatro vezes a infraestrutura.

Consequência prática: ao desenhar o preço de fundador, **o que precisa ser protegido é
a hora, não o servidor.** Mensalidade baixa com horas de evolução generosas é o que
quebra; mensalidade baixa com escopo de suporte bem delimitado, não.

## Por que não Firestore

O Firestore tem free tier atraente e sincronização offline pronta — exatamente o que a
feature `002` constrói à mão. É o único argumento real a favor, e é honesto.

Mesmo assim, não:

1. **Viola a constitution §9** — nenhum dado de negócio fora do Cloud SQL — e
   contraria o ADR-0005. Trocar exigiria um ADR que os revogue.
2. **O produto inteiro é agregação.** Custo por saca, margem por cabeça, rateio em dois
   níveis, livro caixa por imóvel e período. Isso é `JOIN` e `GROUP BY`. O Firestore não
   tem JOIN e tem agregação limitada: a saída é desnormalizar e manter contadores à mão —
   que é como se produz número errado em sistema contábil (constitution §4).
3. **PostGIS não tem equivalente.** Talhão é polígono e a área sai do polígono, não da
   digitação. O Firestore faz consulta por proximidade, não geometria. A feature `012`
   não existiria.
4. **O custo é por documento lido.** Um relatório que varre 50 mil lançamentos custa
   50 mil leituras e estoura o free tier diário num único clique. No Cloud SQL, a mesma
   consulta roda dentro de um custo fixo que já está pago.

**Híbrido (Firestore para sync, Postgres para cálculo) é pior que os dois**: dois bancos,
duas verdades e um problema de consistência que ninguém pediu.

**O Firebase que usamos já está certo:** o Identity Platform é Firebase Auth — grátis
até 50 mil usuários ativos, com emulador local (ADR-0012). É a parte do Firebase que
resolve um problema real sem custo e sem violar princípio nenhum.

E Firebase Hosting não substitui o Cloudflare Pages: o free tier do Pages tem banda
ilimitada, o do Hosting não (ADR-0006).

## Fontes

[Cloud Run — preços](https://cloud.google.com/run/pricing) ·
[Cloud SQL — preços](https://cloud.google.com/sql/pricing) ·
[Bytebase — tabela de preços do Cloud SQL](https://www.bytebase.com/dbcost/cloudsql-pricing/) ·
[Google Cloud — recursos gratuitos](https://docs.cloud.google.com/free/docs/free-cloud-features) ·
[Identity Platform — preços](https://cloud.google.com/identity-platform/pricing) ·
[Cloudflare — limites do plano free](https://eastondev.com/blog/en/posts/dev/20260526-cloudflare-free-limits/) ·
[Cloudflare Pages — free tier 2026](https://dev.to/nayankyada/cloudflare-pages-pricing-2026-free-tier-limits-workers-costs-when-to-upgrade-2ono)
