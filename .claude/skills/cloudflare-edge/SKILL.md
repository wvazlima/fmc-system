---
name: cloudflare-edge
description: Borda Cloudflare do projeto — Pages, Worker proxy com cabeçalho secreto, regras de cache do PWA, WAF sem challenge na API, R2 para PMTiles. Use ao mexer em apps/edge, configurar DNS, WAF, cache, publicar o PWA, ou ao decidir o que pode e o que não pode ficar na borda.
---

# Borda Cloudflare

Cloudflare é **borda**; Google Cloud é **núcleo** (ADR-0006). A fronteira entre os dois
é dura e está na constitution §9: **nenhum dado de negócio fora do Cloud SQL.**

## O que roda aqui

| Componente                        | Papel                                      |
| --------------------------------- | ------------------------------------------ |
| DNS + WAF + TLS **Full (strict)** | entrada de tudo                            |
| **Pages**                         | PWA estático (export do Next.js)           |
| **Worker** (`apps/edge`)          | proxy reverso de `/api/*` para o Cloud Run |
| **R2**                            | **só** os PMTiles do mapa base             |

## O Worker proxy

É **proxy reverso e nada mais**. Sem lógica de negócio, sem cache de resposta de API,
sem transformação de payload.

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 })

    const upstream = new URL(url.pathname + url.search, env.API_ORIGIN)
    const headers = new Headers(request.headers)
    headers.set('X-Edge-Secret', env.EDGE_SECRET) // secret do Worker
    headers.set('X-Forwarded-Host', url.host)

    return fetch(
      new Request(upstream, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      }),
    )
  },
}
```

Do outro lado, a API **rejeita com 403** qualquer requisição sem o cabeçalho válido. A
URL do Cloud Run não aparece em código de cliente, documentação pública nem log.

- `EDGE_SECRET` e `API_ORIGIN` são **secrets e vars do Worker**, nunca literais no
  código.
- Rotação do segredo: adicione o novo como aceito na API, troque no Worker, remova o
  antigo. Documente e teste.
- Preserve o corpo e o método. Requisição de sync é `POST` com payload grande.

## WAF

- **Sem challenge e sem CAPTCHA em `/api/*`.** O cliente é um PWA sincronizando em
  segundo plano — ele não resolve desafio, e o sync quebra em silêncio.
- Rate limit **por IP e por rota** é aceitável, com teto folgado: um dispositivo que
  ficou offline o dia inteiro faz uma rajada legítima ao reconectar.
- Regras gerenciadas de OWASP ligadas, com exceção monitorada para as rotas de sync.

## Cache do PWA

| Recurso                | `Cache-Control`                       | Por quê                                                                            |
| ---------------------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| `sw.js`, `index.html`  | `no-cache`                            | se o Service Worker ficar em cache, o usuário trava numa versão antiga para sempre |
| asset com hash no nome | `public, max-age=31536000, immutable` | o nome muda quando o conteúdo muda                                                 |
| PMTiles no R2          | `public, max-age=86400` + ETag        | muda pouco, é grande                                                               |
| `/api/*`               | **sem cache**                         | dado de negócio nunca é cacheado na borda                                          |

Esta tabela é a causa da maioria dos bugs de "o app não atualizou" — trate-a como
contrato.

## R2

- **Só PMTiles.** Nenhum outro conteúdo (constitution §9).
- É artefato **público derivado**: não contém dado de negócio, só imagem de satélite
  processada.
- Motivo de estar aqui: **R2 não cobra egress**, e pacote de mapa é grande e muito
  baixado.
- Atribuição do Copernicus é responsabilidade da tela que renderiza, não do bucket.

## Proibido na borda

- Dado de negócio em **Workers KV**, **D1** ou **Durable Objects**.
- Cache de resposta de API.
- Dado pessoal ou financeiro em log de Worker ou em analytics de borda.
- Lógica de negócio no Worker.
- Qualquer coisa no R2 que não seja PMTiles.

## Local

No Compose, o Worker roda com `wrangler dev` no container `edge`, na porta `8787`, com
o mesmo `apps/edge/src/index.ts` de produção (ADR-0010). O `API_ORIGIN` local aponta
para `http://api:3001` e o `EDGE_SECRET` vem do `.env`.
