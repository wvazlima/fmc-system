/**
 * Worker de borda — proxy reverso para a API (ADR-0006).
 *
 * É proxy e NADA MAIS: sem lógica de negócio, sem cache de resposta de API, sem
 * transformação de payload. Ele injeta o cabeçalho secreto que a origem exige; a API
 * rejeita com 403 qualquer requisição sem ele, e a URL do Cloud Run não é divulgada.
 *
 * Proibido guardar dado de negócio em KV, D1 ou Durable Objects (constitution §9).
 */

export interface Env {
  /** Secret do Worker. Nunca em `vars`, nunca no código. */
  EDGE_SECRET: string
  /** Origem da API (Cloud Run em produção; o container `api` no local). */
  API_ORIGIN: string
}

const EDGE_SECRET_HEADER = 'X-Edge-Secret'
const API_PREFIX = '/api/'
/** Saúde do próprio Worker, sem tocar na origem — usada pelo healthcheck do Compose. */
const EDGE_HEALTH_PATH = '/__edge/health'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === EDGE_HEALTH_PATH) {
      return Response.json({ status: 'ok', role: 'edge-proxy' })
    }

    if (!url.pathname.startsWith(API_PREFIX)) {
      return new Response('Not found', { status: 404 })
    }

    // O prefixo `/api` é roteamento da borda: a origem não precisa saber em que caminho
    // está montada. `/api/sync/push` chega na API como `/sync/push`.
    const upstreamPath = url.pathname.slice(API_PREFIX.length - 1) || '/'
    const upstream = new URL(upstreamPath + url.search, env.API_ORIGIN)

    const headers = new Headers(request.headers)
    headers.set(EDGE_SECRET_HEADER, env.EDGE_SECRET)
    headers.set('X-Forwarded-Host', url.host)
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''))
    // A origem não deve receber o Host da borda.
    headers.delete('host')

    const proxied = new Request(upstream.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    })

    try {
      return await fetch(proxied)
    } catch {
      // Não vazamos a origem nem o motivo real da falha.
      return Response.json(
        { code: 'UPSTREAM_UNAVAILABLE', message: 'Serviço indisponível. Tente novamente.' },
        { status: 502 },
      )
    }
  },
} satisfies ExportedHandler<Env>
