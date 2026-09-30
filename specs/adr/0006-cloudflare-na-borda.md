# ADR-0006 · Cloudflare na borda, com Worker como proxy reverso

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

A API roda em Cloud Run, que expõe uma URL pública `*.run.app`. Precisamos de WAF, TLS
gerenciado, DNS, hospedagem do PWA estático e um lugar barato para servir os pacotes de
mapa (PMTiles, arquivos grandes, muito acessados, imutáveis).

Ao mesmo tempo, os **dados de negócio não podem sair do Cloud SQL** (constitution §9).

## Decisão

Cloudflare cuida da **borda**; Google Cloud cuida do **núcleo**.

- **DNS + WAF + TLS Full (strict)** na Cloudflare.
- **Pages** serve o PWA (export estático do Next.js).
- **Worker** (`apps/edge`) é proxy reverso de `/api/*` para o Cloud Run, injetando o
  cabeçalho secreto **`X-Edge-Secret`**. A API **rejeita com 403** qualquer requisição
  sem o cabeçalho válido. A URL do Cloud Run não é divulgada.
- **R2** guarda exclusivamente os **PMTiles** do mapa base — artefato público derivado.
- **Sem challenge/CAPTCHA** nas rotas `/api/*`.

## Alternativas consideradas

### Só Google Cloud (Cloud Load Balancing + Cloud Armor + Cloud CDN)

- **A favor:** um fornecedor, um Terraform, um IAM.
- **Contra:** o Load Balancer global tem custo fixo mensal relevante para o porte do
  projeto; o egress do GCS para os PMTiles é caro; e o Cloud Armor é mais trabalhoso
  que o WAF da Cloudflare para o que precisamos.
- **Por que não:** custo. O R2 não cobra egress, e os pacotes de mapa são exatamente o
  tipo de tráfego que faria essa conta doer.

### Cloud Run com IAM e autenticação de serviço, sem cabeçalho secreto

- **A favor:** mecanismo nativo, sem segredo compartilhado.
- **Contra:** o Worker precisaria obter e renovar um token de identidade do Google a
  cada requisição.
- **Por que não:** mais partes móveis para o mesmo resultado. Fica anotado como
  evolução possível se o segredo compartilhado se mostrar frágil.

### Mover a API para Workers

- **A favor:** uma plataforma a menos.
- **Contra:** o runtime dos Workers não é Node completo; Drizzle com `pg`, PostGIS e
  conexão persistente ao Cloud SQL não encaixam bem.
- **Por que não:** conflita com ADR-0003 e ADR-0005.

## Consequências

**Positivas**

- Origem protegida sem IP público exposto.
- PMTiles servidos sem custo de egress.
- WAF e TLS gerenciados, com certificado automático.

**Negativas e custos aceitos**

- Dois fornecedores, dois providers no Terraform, dois lugares para olhar num incidente.
- O `X-Edge-Secret` é um segredo compartilhado que precisa de rotação documentada.
- Um salto extra de rede em toda requisição de API.

**O que passa a ser proibido**

- Qualquer dado de negócio em Workers KV, D1, Durable Objects ou cache de borda.
- R2 guardando qualquer coisa que não seja PMTiles.
- Expor a URL do Cloud Run em código de cliente, documentação pública ou log.
- Ativar challenge em rota `/api/*`.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/infra.md`; skill `cloudflare-edge`; agentes `infra-cloud` e
`security-reviewer`; teste de integração que confirma 403 sem o cabeçalho.
