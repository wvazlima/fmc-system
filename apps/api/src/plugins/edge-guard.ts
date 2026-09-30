import fp from 'fastify-plugin'
import { timingSafeEqual } from 'node:crypto'

export const EDGE_SECRET_HEADER = 'x-edge-secret'

/** Rotas que respondem sem o cabeçalho da borda (o healthcheck do Compose e do Cloud Run). */
const PUBLIC_PATHS = new Set(['/health'])

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * A API não aceita tráfego público direto (ADR-0006). Só passa requisição com o
 * cabeçalho secreto injetado pelo Worker de borda.
 */
export default fp<{ edgeSecret: string }>(async (app, opts) => {
  app.addHook('onRequest', async (request, reply) => {
    if (PUBLIC_PATHS.has(request.url.split('?')[0] ?? '')) return

    const provided = request.headers[EDGE_SECRET_HEADER]
    if (typeof provided !== 'string' || !safeEqual(provided, opts.edgeSecret)) {
      // Sem detalhe na resposta: não informamos ao chamador o que faltou.
      return reply.code(403).send({ code: 'FORBIDDEN', message: 'Acesso negado.' })
    }
  })
})
